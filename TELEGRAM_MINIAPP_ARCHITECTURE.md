# АРХИТЕКТУРА TELEGRAM MINIAPP ИНТЕГРАЦИИ

## ОБЩАЯ СХЕМА

```
Telegram Client
    │
    ├── Telegram Bot (@YourBot)
    │   └── MiniApp URL: https://yourdomain.com/telegram
    │
    └── WebView
        │
        ├── Frontend (React)
        │   ├── Telegram WebApp API
        │   ├── postMessage для обмена данными
        │   └── Адаптация UI под Telegram
        │
        └── Backend API
            ├── Telegram Auth (проверка initData)
            ├── REST API (те же endpoints)
            └── WebSocket (те же события)
```

---

## КОМПОНЕНТЫ

### 1. TELEGRAM BOT

**Назначение:**
- Создание и настройка MiniApp
- Получение initData для аутентификации
- Управление MiniApp через команды

**Требования:**
- Telegram Bot Token
- Настроенный MiniApp URL
- Webhook или polling

---

### 2. TELEGRAM WEBAPP API

**Назначение:**
- Получение данных пользователя Telegram
- Аутентификация через initData
- Обмен данными с Telegram клиентом

**Основные методы:**
- `window.Telegram.WebApp.initData` - данные пользователя
- `window.Telegram.WebApp.sendData()` - отправка данных в Bot
- `window.Telegram.WebApp.ready()` - готовность приложения
- `window.Telegram.WebApp.expand()` - развертывание на весь экран

---

### 3. АУТЕНТИФИКАЦИЯ

**Поток:**
```
1. Пользователь открывает MiniApp в Telegram
2. Telegram передает initData в WebView
3. Frontend отправляет initData на Backend
4. Backend проверяет подпись initData (HMAC SHA-256)
5. Backend создает/находит пользователя по Telegram ID
6. Backend возвращает JWT токен
7. Frontend использует токен для API и WebSocket
```

**Безопасность:**
- Проверка подписи initData (Telegram Bot Token)
- Валидация timestamp (не старше 24 часов)
- Создание пользователя автоматически при первом входе

---

### 4. ИНТЕГРАЦИЯ С СУЩЕСТВУЮЩИМ BACKEND

**Изменения:**
- Новый endpoint: `POST /auth/telegram` для аутентификации через Telegram
- Обновление User модели: добавление `telegramId`
- Использование существующих модулей (Chats, Messages, WebSocket)

**Совместимость:**
- Те же REST API endpoints
- Те же WebSocket события
- Та же логика работы

---

## СТРУКТУРА КОДА

### Backend

```typescript
// auth/telegram-auth.service.ts
- verifyInitData(initData: string): TelegramUser
- createOrUpdateUser(telegramUser): User
- generateJWT(user): token

// auth/auth.controller.ts
POST /auth/telegram { initData }
```

### Frontend (Telegram MiniApp)

```typescript
// services/telegram.service.ts
- getInitData(): string
- sendDataToBot(data)
- expand()

// components/TelegramAuth.tsx
- Автоматическая аутентификация при загрузке
- Использование Telegram WebApp API
```

---

## ОТЛИЧИЯ ОТ ОБЫЧНОГО WEB

### 1. Аутентификация
- **Обычный Web**: Email + Password → JWT
- **Telegram MiniApp**: initData → проверка подписи → JWT

### 2. UI/UX
- Адаптация под Telegram стиль
- Использование Telegram цветов
- Кнопки в стиле Telegram
- Нативные элементы Telegram

### 3. Обмен данными
- `postMessage` для отправки данных в Bot
- Получение данных от Bot через события

---

## ПОТОК РАБОТЫ

### Инициализация MiniApp

```
1. Пользователь открывает MiniApp в Telegram
2. Telegram загружает WebView с вашим Frontend
3. Frontend получает initData через Telegram WebApp API
4. Frontend отправляет initData на Backend
5. Backend проверяет и создает пользователя
6. Frontend получает JWT токен
7. Frontend подключается к WebSocket
8. Приложение готово к работе
```

### Отправка сообщения

```
1. Пользователь отправляет сообщение
2. Frontend → WebSocket → Backend
3. Backend обрабатывает (как обычно)
4. Backend → WebSocket → Получатель
5. (Опционально) Уведомление через Telegram Bot API
```

---

## TELEGRAM BOT API ИНТЕГРАЦИЯ

### Уведомления

```typescript
// Отправка уведомления о новом сообщении
TelegramBot.sendMessage(user.telegramId, "Новое сообщение");
```

### Команды Bot

```
/start - Запуск MiniApp
/help - Помощь
/chats - Список чатов (через Bot)
```

---

## БЕЗОПАСНОСТЬ

### 1. Проверка initData
- Валидация подписи (HMAC SHA-256)
- Проверка timestamp
- Проверка hash

### 2. Изоляция
- MiniApp работает в изолированном WebView
- Нет доступа к основному Telegram клиенту
- Безопасный обмен данными через postMessage

---

## UI АДАПТАЦИЯ

### Telegram стиль
- Цветовая схема Telegram
- Кнопки в стиле Telegram
- Анимации и переходы
- Нативные элементы (BackButton, MainButton)

### Компоненты
```tsx
<TelegramMainButton onClick={handleSend}>
  Отправить
</TelegramMainButton>

<TelegramBackButton onClick={handleBack} />
```

---

## ОГРАНИЧЕНИЯ

### Telegram WebView
- Ограниченный доступ к некоторым Web API
- Специфичные ограничения безопасности
- Размер MiniApp ограничен

### Сравнение с нативным приложением
- Медленнее нативного приложения
- Зависит от WebView производительности
- Ограничения по функционалу

---

## ИТОГОВАЯ АРХИТЕКТУРА

1. **Telegram Bot** - создание и управление MiniApp
2. **Frontend (WebView)** - React приложение, адаптированное для Telegram
3. **Backend** - существующий API + Telegram auth endpoint
4. **WebSocket** - тот же WebSocket для real-time
5. **База данных** - та же БД, добавление telegramId в users

Все существующие модули остаются без изменений, добавляется только Telegram аутентификация.
