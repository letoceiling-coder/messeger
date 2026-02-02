# Единый план реализации: подключение нового дизайна и авторизация по телефону

**Версия:** 1.0  
**Дата:** 2026-02-02  
**Объединяет:** SMS_AUTH_SMSC_INTEGRATION, IMPLEMENTATION_READINESS_REPORT, API_DRIVEN_ARCHITECTURE_PROPOSAL, SMSC_SETUP_DONE

---

## Содержание

1. [Обзор и цели](#1-обзор-и-цели)
2. [Фаза 1: Авторизация по телефону (приоритет)](#2-фаза-1-авторизация-по-телефону)
3. [Фаза 2: Подключение chat-hub-design к API](#3-фаза-2-подключение-chat-hub-design)
4. [Абстракция SMS-сервиса (сменяемость)](#4-абстракция-sms-сервиса)
5. [Сохраняемая сессия (remember me)](#5-сохраняемая-сессия)
6. [Чек-листы и порядок работ](#6-чек-листы)
7. [Тестирование](#7-тестирование)

---

## 1. Обзор и цели

### Текущее состояние

| Компонент | Сейчас | Цель |
|-----------|--------|------|
| **Backend auth** | email + password (register/login) | phone + SMS-код |
| **User (Prisma)** | email, username, passwordHash (обязательны) | phone уникален, email/username опциональны |
| **chat-hub-design** | UI телефон + код, mock (код 1234) | Реальная отправка SMS, API |
| **AuthContext** | localStorage: { phone }, без токена | JWT accessToken + user, валидация при старте |
| **SMS** | SmscService (SMSC.ru), POST/JSON UTF-8 | Работает, абстрагировать для смены провайдера |

### Ключевые требования

1. **Авторизация:** телефон → SMS-код → вход (вход и регистрация объединены).
2. **Помнить пользователя:** после входа не требовать повторной SMS при следующем запуске.
3. **Реальный SMS:** убрать тестовый код 1234, подключить SMSC (уже работает).
4. **Сменяемость SMS-сервиса:** интерфейс для замены SMSC на другой провайдер.
5. **Подключение chat-hub-design:** ChatsContext, MessagesContext и др. перевести на API.

---

## 2. Фаза 1: Авторизация по телефону

### 2.1 Схема потока

```
[Первый запуск / нет токена]
  → AuthPage: ввод телефона
  → POST /api/auth/send-code { phone }
  → Бэкенд: генерирует код, сохраняет, шлёт SMS
  → AuthPage: ввод кода
  → POST /api/auth/verify-code { phone, code }
  → Бэкенд: проверяет код, создаёт/находит User, выдаёт JWT
  → Фронт: сохраняет accessToken + user в localStorage
  → Редирект в приложение

[Повторный запуск / есть токен]
  → При загрузке: GET /api/users/me (с Bearer token)
  → 200: пользователь валиден → isAuthenticated=true, показываем приложение
  → 401: токен невалиден → очистить хранилище, показать AuthPage
```

### 2.2 Изменения в БД (Prisma)

**Миграция User** — поддержать вход по телефону, сохранить совместимость со старыми пользователями.

```prisma
model User {
  id           String   @id @default(uuid())
  phone        String?  @unique @map("phone")      // NEW: основной для входа по SMS
  email        String?  @unique @map("email")      // CHANGED: optional (было required)
  username     String   @map("username")           // CHANGED: убрать unique или оставить
  passwordHash String?  @map("password_hash")      // CHANGED: optional (для старых пользователей)
  avatarUrl    String?  @map("avatar_url")
  isOnline     Boolean  @default(false) @map("is_online")
  lastSeenAt   DateTime? @map("last_seen_at")
  telegramId   String?  @unique @map("telegram_id")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  // ...
}
```

**Вариант с двумя уникальными индексами:**  
`phone` и `email` оба optional, оба unique. При создании User по phone: `username = "user_" + phone.slice(-6)`.

**Таблица SmsCode** — хранение кодов (или in-memory кэш).

```prisma
model SmsCode {
  id        String   @id @default(uuid())
  phone     String
  code      String
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  @@index([phone])
  @@index([expiresAt])
  @@map("sms_codes")
}
```

**Стратегия миграции:**
- Добавить `phone` nullable unique.
- Сделать `email` и `passwordHash` nullable (для существующих пользователей).
- Создать таблицу `sms_codes`.
- Запустить миграцию, при необходимости обновить seed.

### 2.3 Backend: новые endpoints

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/auth/send-code` | POST | `{ phone: string }` | `{ success: boolean }` |
| `/auth/verify-code` | POST | `{ phone: string, code: string }` | `{ accessToken, user }` |
| `/users/me` | GET | (Bearer token) | `{ id, phone, username, email?, avatarUrl? }` |

**send-code:**
1. Нормализовать phone (`+7XXXXXXXXXX`).
2. Проверить формат (10 цифр).
3. Rate limit: 1 запрос в 60 сек на номер (по phone).
4. Сгенерировать код (4–6 цифр).
5. Сохранить в SmsCode (TTL 5 мин) или in-memory.
6. Отправить SMS через абстракцию (см. п. 4).
7. Вернуть `{ success: true }`.

**verify-code:**
1. Проверить код по phone.
2. Удалить использованный код.
3. Найти или создать User по phone.
4. Сгенерировать JWT (sub=userId, expiresIn 7d или 30d).
5. Вернуть `{ accessToken, user }`.

### 2.4 JWT

- Payload: `{ sub: userId }` (достаточно).
- `expiresIn`: 7d или 30d (JWT_EXPIRES_IN).
- `JwtStrategy.validate`: искать User по `payload.sub`, возвращать `{ id, phone, username, email, avatarUrl }`.
- `/users/me`: защищён JwtAuthGuard, возвращает текущего пользователя.

### 2.5 Старая авторизация (email/password)

- Вариант A: оставить `/auth/login` и `/auth/register` для обратной совместимости.
- Вариант B: постепенно убрать, если все переходят на телефон.
- В плане: оставить login/register, но основной поток — phone + verify-code.

---

## 3. Фаза 2: Подключение chat-hub-design к API

### 3.1 AuthContext — связь с API

| Метод | Было | Стало |
|-------|------|-------|
| `requestCode(phone)` | setPendingPhone | POST /auth/send-code, затем setPendingPhone |
| `verifyCode(code)` | проверка 1234, saveAuth(phone) | POST /auth/verify-code, сохранить accessToken + user |
| `loadAuth` / init | localStorage messenger-auth (phone) | localStorage accessToken; GET /users/me для проверки |
| `logout` | saveAuth(null) | удалить accessToken, user, messenger-auth |

**Структура localStorage:**
```ts
// accessToken — для API
localStorage.setItem('accessToken', token);

// user — для UI (id, phone, username)
localStorage.setItem('user', JSON.stringify(user));

// messenger-auth — убрать или оставить только для обратной совместимости
```

### 3.2 Порядок инициализации

1. При загрузке: читать `accessToken` из localStorage.
2. Если есть: вызвать `GET /users/me` с Bearer.
3. 200: установить user, isAuthenticated=true.
4. 401: очистить accessToken и user, isAuthenticated=false.
5. Нет токена: isAuthenticated=false.
6. Пока идёт проверка: показать loader или скелетон.

### 3.3 ChatsContext, MessagesContext и др.

После стабилизации авторизации:
- ChatsContext: загрузка чатов через `GET /api/chats`.
- MessagesContext: `GET /api/messages?chatId=...`, WebSocket для новых сообщений.
- ContactsContext: `GET /api/contacts`.
- Заменить mockData на ответы API.

Детали — в IMPLEMENTATION_READINESS_REPORT и API_DRIVEN_ARCHITECTURE_PROPOSAL.

---

## 4. Абстракция SMS-сервиса

### 4.1 Интерфейс

```typescript
// smsc/sms-provider.interface.ts
export interface SmsSendResult {
  success: boolean;
  id?: string | number;
  error?: string;
  errorCode?: number;
}

export interface ISmsProvider {
  sendSms(phone: string, text: string): Promise<SmsSendResult>;
}
```

### 4.2 Реализации

- **SmscProvider** (текущий SmscService): реализует `ISmsProvider`.
- **MockSmsProvider** (для тестов): логирует в консоль, не шлёт SMS.
- **FutureProvider** (Twilio, UniSender и т.п.): новые классы с тем же интерфейсом.

### 4.3 Конфигурация

```env
# Текущий
SMS_PROVIDER=smsc
SMSC_LOGIN=...
SMSC_PASSWORD=...

# Будущий пример
# SMS_PROVIDER=twilio
# TWILIO_ACCOUNT_SID=...
# TWILIO_AUTH_TOKEN=...
# TWILIO_FROM=...
```

### 4.4 DI в NestJS

```typescript
// smsc/smsc.module.ts
const smsProvider = {
  provide: 'SMS_PROVIDER',
  useFactory: (config: ConfigService) => {
    const provider = config.get('SMS_PROVIDER') || 'smsc';
    if (provider === 'smsc') return new SmscProvider(config);
    if (provider === 'mock') return new MockSmsProvider();
    throw new Error(`Unknown SMS provider: ${provider}`);
  },
  inject: [ConfigService],
};
```

SmsCodeService инжектит `@Inject('SMS_PROVIDER')` и вызывает `sendSms`.

---

## 5. Сохраняемая сессия

### 5.1 Что хранить

| Ключ | Содержимое |
|------|------------|
| `accessToken` | JWT |
| `user` | `{ id, phone, username, email?, avatarUrl? }` |

### 5.2 Срок жизни JWT

- Рекомендация: 7–30 дней (`JWT_EXPIRES_IN=7d` или `30d`).
- Refresh-токены — отдельная доработка, в базовом плане не предусмотрены.

### 5.3 Логика при загрузке

```
1. Читать accessToken из localStorage
2. Если нет → показать AuthPage
3. Если есть → GET /api/users/me
   - 200 → user в state, isAuthenticated=true
   - 401 → очистить storage, показать AuthPage
4. Ошибка сети → повторить или показать ошибку
```

### 5.4 Logout

- Удалить `accessToken`, `user`, `messenger-auth`.
- Опционально: вызвать `POST /auth/logout` для инвалидации на сервере (если будет blacklist).

---

## 6. Чек-листы

### 6.1 Фаза 1: Backend

- [ ] Создать интерфейс `ISmsProvider` и обернуть SmscService
- [ ] Добавить `SMS_PROVIDER` в конфиг, поддержать `mock` для тестов
- [ ] Миграция Prisma: phone, SmsCode, email/passwordHash optional
- [ ] SmsCodeService: генерация кода, сохранение, проверка, rate limit
- [ ] POST /auth/send-code
- [ ] POST /auth/verify-code
- [ ] GET /users/me (если ещё нет)
- [ ] Обновить JwtStrategy под User с phone
- [ ] Обновить AuthResponseDto (user с phone)

### 6.2 Фаза 1: Frontend (chat-hub-design)

- [ ] AuthContext: requestCode → POST /auth/send-code
- [ ] AuthContext: verifyCode → POST /auth/verify-code, сохранить accessToken + user
- [ ] AuthContext: init — проверка accessToken через GET /users/me
- [ ] AuthContext: logout — очистка storage
- [ ] Удалить TEST_SMS_CODE (1234)
- [ ] api.ts: исправить путь при 401 (auth/login → auth/send-code, auth/verify-code)
- [ ] AuthPage: обработка ошибок (сеть, неверный код)
- [ ] AuthPage: loading при requestCode и verifyCode

### 6.3 Фаза 2 (после стабилизации)

- [ ] ChatsContext → GET /chats
- [ ] MessagesContext → GET /messages + WebSocket
- [ ] WebSocket: передача accessToken при подключении
- [ ] Замена mockData на API во всех контекстах
- [ ] Остальные сущности по IMPLEMENTATION_READINESS_REPORT

---

## 7. Тестирование

### 7.1 Авторизация

1. Ввод телефона → отправка кода → SMS приходит.
2. Ввод кода → успешный вход → редирект.
3. Обновление страницы → пользователь остаётся авторизованным.
4. Logout → переход на логин.
5. Истечение JWT → 401 → переход на логин.
6. Неверный код → сообщение об ошибке.
7. Rate limit send-code → ограничение повторной отправки.

### 7.2 SMS

1. Кириллица в SMS отображается корректно.
2. Формат номера: +7 (999) 123-45-67 → 79991234567.
3. Сменяемость: `SMS_PROVIDER=mock` — без реальной отправки.

---

## 8. Риски и митигация

| Риск | Митигация |
|------|-----------|
| Существующие пользователи без phone | Оставить email/password как альтернативу; добавить phone в профиле |
| Миграция Prisma на проде | Тестовая миграция на копии БД; бэкап перед применением |
| SMS не приходит | Логирование в SmsCodeService; fallback MockSmsProvider для dev |
| Утечка SMSC-credentials | Только env, не в коде; ротация паролей |

---

## 9. Порядок реализации

1. **Backend:** ISmsProvider, SmsCodeService, миграция, send-code, verify-code. ✅
2. **Backend:** GET /users/me, обновление JwtStrategy. ✅
3. **Frontend:** AuthContext + API, хранение токена, проверка при старте. ✅
4. **Frontend:** Убрать 1234, обработка ошибок, loading. ✅
5. **Тестирование:** полный цикл авторизации и повторного входа.
6. **Дальше:** ChatsContext, MessagesContext и остальные контексты.

---

## 10. Статус реализации (2026-02-02)

### Сделано
- Backend: `ISmsProvider`, `SmscService`, `MockSmsProvider`, `SmsCodeService`
- Backend: `POST /auth/send-code`, `POST /auth/verify-code`
- Backend: миграция User (phone, optional email/passwordHash), таблица SmsCode
- Frontend: AuthContext с API, accessToken + user в localStorage
- Frontend: проверка сессии при загрузке (GET /users/me)
- Frontend: AuthPage с async requestCode/verifyCode, loading, error
- Frontend: RequireAuth/LoginRoute с isLoading

### Для запуска
1. **Миграция на сервере:** при первом деплое возможна ошибка P3005 — выполнить SQL вручную из `prisma/migrations/20260202000000_phone_auth_sms_codes/migration.sql`, затем `npx prisma migrate resolve --applied 20260202000000_phone_auth_sms_codes`
2. **Backend:** PORT=3000 (proxy в chat-hub-design) или изменить target в vite.config
3. **Backend .env:** SMSC_LOGIN, SMSC_PASSWORD (или SMS_PROVIDER=mock для тестов без SMS)
4. **chat-hub-design:** `npm run dev` — прокси /api → localhost:3000
