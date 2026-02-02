# Авторизация по телефону + SMSC.ru: анализ и интеграция

## 1. Текущее состояние

| Компонент | Сейчас | Нужно |
|-----------|--------|-------|
| **Backend auth** | email + password (register/login) | phone + SMS-код |
| **User (Prisma)** | email, username, passwordHash | phone (уникальный), без пароля |
| **chat-hub-design** | UI: телефон + код (4 цифры) | Подключить к API |
| **AuthContext** | mock: код 1234, нет API | requestCode → API, verifyCode → API |

---

## 2. SMSC.ru — подходит ли сервис?

### ✅ Подходит

- **Назначение:** SMS-шлюз для России и СНГ
- **API:** HTTP/HTTPS, REST, JSON
- **Сценарий:** Отправка одноразового кода (4–6 цифр) на номер телефона
- **Доступ:** Логин и пароль или API-ключ

### Основные параметры (из [документации SMSC.ru](https://smsc.ru/api/#menu))

| Параметр | Описание |
|----------|----------|
| **login** | Логин в личном кабинете |
| **psw** | Пароль (можно заменить на apikey) |
| **phones** | Номер в формате 79991234567 или +79991234567 |
| **mes** | Текст SMS (до 1000 символов, 1 SMS ≈ 70 кириллицы) |
| **charset** | utf-8 для кириллицы |
| **fmt** | 3 — ответ в JSON |

### Примеры запросов

**GET:**
```
https://smsc.ru/sys/send.php?login=LOGIN&psw=PASSWORD&phones=79991234567&mes=Код:1234&charset=utf-8
```

**REST (POST JSON):**
```
POST https://smsc.ru/rest/send/
Content-Type: application/json

{
  "login": "LOGIN",
  "psw": "PASSWORD",
  "phones": "79991234567",
  "mes": "Ваш код: 1234",
  "charset": "utf-8",
  "fmt": 3
}
```

**Ответ (fmt=3):**
```json
{"id": 12345, "cnt": 1}
```
или при ошибке:
```json
{"error": "текст", "error_code": 2}
```

### Ограничения и стоимость

- Платный сервис: списание за каждую SMS
- Лимиты: обычно до 50 запросов в секунду
- Баланс: проверка через API (`/sys/balance.php`)
- Коды ошибок: 1 — ошибка, 2 — недостаточно средств и др.

---

## 3. Безопасность учётных данных

**Не хранить логин и пароль в коде.** Использовать переменные окружения:

```env
SMSC_LOGIN=dsc-23
SMSC_PASSWORD=Kucaevivan19
```

Или API-ключ (если включён в личном кабинете SMSC):

```env
SMSC_APIKEY=...
```

---

## 4. Схема авторизации по телефону

### 4.1 Поток

```
1. Пользователь вводит телефон (+7 999 123-45-67)
2. Фронт → POST /api/auth/send-code { phone: "+79991234567" }
3. Бэкенд:
   - генерирует код (4–6 цифр)
   - сохраняет в кэш: phone → { code, expiresAt } (TTL 5 мин)
   - отправляет SMS через SMSC.ru
   - возвращает { success: true }
4. Пользователь вводит код
5. Фронт → POST /api/auth/verify-code { phone: "+79991234567", code: "1234" }
6. Бэкенд:
   - проверяет код из кэша
   - ищет User по phone
   - если нет — создаёт нового (phone — уникальный ключ)
   - выдаёт JWT
   - возвращает { accessToken, user: { id, phone, username? } }
```

### 4.2 Регистрация vs вход

При phone-only логике вход и регистрация объединяются:

- При первом входе: User создаётся по phone
- При повторном: User находится по phone

Дополнительная регистрация не нужна.

---

## 5. Изменения в БД (Prisma)

### Миграция User

**Было:**
```
email (unique), username (unique), passwordHash
```

**Нужно (вариант A — phone как основной):**
```
phone (unique, NOT NULL)  — основной идентификатор
username (nullable)       — можно задать позже в профиле
email (nullable)          — опционально
passwordHash (nullable)   — убрать или оставить для будущего
```

**Вариант B (минимальный):**
```
phone (unique, NOT NULL)
username (String, default = "user_" + slice(phone, -4))  — автогенерация
```

### Таблица для кодов (опционально)

Если не использовать Redis/Memory-кэш:

```prisma
model SmsCode {
  id        String   @id @default(uuid())
  phone     String
  code      String
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  @@index([phone, expiresAt])
  @@map("sms_codes")
}
```

---

## 6. Backend: новые endpoints

### POST /api/auth/send-code

**Request:**
```json
{ "phone": "+79991234567" }
```

**Действия:**
1. Нормализовать phone (только цифры, +7)
2. Проверить формат (10 цифр после 7)
3. Сгенерировать code (4–6 цифр)
4. Сохранить в кэш/БД с TTL 5 мин
5. Отправить SMS через SMSC
6. Вернуть `{ success: true }` (без кода)

**Ограничения:**
- Не чаще 1 раз в 60 сек на один номер (антиспам)

### POST /api/auth/verify-code

**Request:**
```json
{ "phone": "+79991234567", "code": "1234" }
```

**Response:**
```json
{
  "accessToken": "jwt...",
  "user": { "id": "...", "phone": "+79991234567", "username": "user_4567" }
}
```

---

## 7. SMSC-сервис (NestJS)

```typescript
// smsc.service.ts
@Injectable()
export class SmscService {
  private readonly baseUrl = 'https://smsc.ru';
  
  constructor(private config: ConfigService) {}
  
  async sendSms(phone: string, text: string): Promise<{ id?: number; error?: string }> {
    const login = this.config.get('SMSC_LOGIN');
    const psw = this.config.get('SMSC_PASSWORD');
    const cleanPhone = phone.replace(/\D/g).replace(/^8/, '7');
    
    const params = new URLSearchParams({
      login,
      psw,
      phones: cleanPhone,
      mes: text,
      charset: 'utf-8',
      fmt: '3',
    });
    
    const res = await fetch(`${this.baseUrl}/sys/send.php?${params}`);
    return res.json();
  }
}
```

---

## 8. Чек-лист внедрения

- [ ] Добавить `SMSC_LOGIN`, `SMSC_PASSWORD` в `.env`
- [ ] Миграция Prisma: `phone` unique, `email`/`username` optional
- [ ] Создать `SmscService` (или аналогичный HTTP-клиент)
- [ ] Создать `SmsCodeService` (генерация, кэш, проверка)
- [ ] Endpoint `POST /auth/send-code`
- [ ] Endpoint `POST /auth/verify-code`
- [ ] Обновить JWT payload (sub, phone вместо email)
- [ ] Обновить AuthContext: `requestCode` → fetch send-code
- [ ] Обновить AuthContext: `verifyCode` → fetch verify-code
- [ ] Убрать тестовый код 1234
- [ ] Добавить rate limit на send-code (1 раз в 60 сек на номер)

---

## 9. Рекомендации

1. **SMSC.ru** подходит для отправки SMS-кодов входа.
2. Логин и пароль хранить только в переменных окружения.
3. Использовать REST/JSON (`fmt=3`) для удобного парсинга.
4. Ввести ограничение 1 запрос на номер в минуту.
5. Сделать TTL кода 5 минут.
6. В проде проверить баланс и тарифы SMSC.
