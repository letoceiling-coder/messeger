# ПЛАН ИНТЕГРАЦИИ TELEGRAM MINIAPP

## ЭТАП 1: TELEGRAM BOT

### 1.1 Создание Bot
- [ ] Создать Bot через @BotFather
- [ ] Получить Bot Token
- [ ] Настроить MiniApp через BotFather
- [ ] Указать URL MiniApp

### 1.2 Настройка Bot
- [ ] Команды: /start, /help
- [ ] Описание Bot
- [ ] Аватар Bot

---

## ЭТАП 2: BACKEND ИНТЕГРАЦИЯ

### 2.1 Обновление схемы БД
- [ ] Добавить поле `telegramId` в таблицу `users`
- [ ] Сделать `telegramId` уникальным (опционально)
- [ ] Миграция Prisma

### 2.2 Telegram Auth Service
- [ ] Создать `telegram-auth.service.ts`
- [ ] Реализовать проверку initData (HMAC SHA-256)
- [ ] Реализовать создание/обновление пользователя
- [ ] Генерация JWT токена

### 2.3 Telegram Auth Controller
- [ ] Endpoint `POST /auth/telegram`
- [ ] Валидация initData
- [ ] Возврат JWT токена

### 2.4 Зависимости
- [ ] Установить `crypto` для проверки подписи
- [ ] Настроить Bot Token в .env

---

## ЭТАП 3: FRONTEND (TELEGRAM WEBVIEW)

### 3.1 Telegram Service
- [ ] Создать `telegram.service.ts`
- [ ] Обертка над Telegram WebApp API
- [ ] Получение initData
- [ ] Отправка данных в Bot

### 3.2 Telegram Auth Component
- [ ] Компонент автоматической аутентификации
- [ ] Использование initData
- [ ] Сохранение токена

### 3.3 Адаптация UI
- [ ] Telegram цветовая схема
- [ ] Telegram кнопки (MainButton, BackButton)
- [ ] Адаптация под мобильный вид
- [ ] Использование Telegram иконок

### 3.4 Интеграция
- [ ] Обновить AuthContext для Telegram
- [ ] Обновить роутинг
- [ ] Те же компоненты чатов и сообщений

---

## ЭТАП 4: ТЕСТИРОВАНИЕ

### 4.1 Локальное тестирование
- [ ] Тестирование проверки initData
- [ ] Тестирование создания пользователя
- [ ] Тестирование аутентификации

### 4.2 Telegram тестирование
- [ ] Развертывание на сервере
- [ ] Тестирование в Telegram Web
- [ ] Тестирование в Telegram Desktop
- [ ] Тестирование в Telegram Mobile

---

## ТЕХНИЧЕСКИЕ ДЕТАЛИ

### Проверка initData

**Формат initData:**
```
hash=xxx&user=...&auth_date=...&...
```

**Проверка:**
1. Извлечь hash
2. Создать data-check-string (без hash)
3. Вычислить HMAC SHA-256 с Bot Token
4. Сравнить с hash

**Пример кода:**
```typescript
import * as crypto from 'crypto';

function verifyInitData(initData: string, botToken: string): boolean {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');
  
  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  return calculatedHash === hash;
}
```

---

## СТРУКТУРА ФАЙЛОВ

### Backend
```
backend/src/auth/
├── telegram-auth.service.ts  (новый)
├── telegram-auth.controller.ts (новый)
└── auth.module.ts (обновить)
```

### Frontend
```
frontend-web/src/
├── services/
│   └── telegram.service.ts (новый)
├── components/
│   └── TelegramAuth.tsx (новый)
└── pages/
    └── TelegramApp.tsx (новый, обертка)
```

---

## КОНФИГУРАЦИЯ

### Backend .env
```env
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_WEBAPP_URL=https://yourdomain.com/telegram
```

### Frontend
```env
VITE_TELEGRAM_BOT_NAME=your_bot_name
```

---

## ОГРАНИЧЕНИЯ И ОСОБЕННОСТИ

### Ограничения Telegram WebView
- Нет доступа к некоторым Web API
- Ограничения по размеру
- Специфичные ограничения безопасности

### Особенности
- Автоматическая аутентификация при загрузке
- Нет необходимости в логине/пароле
- Интеграция с Telegram контактами (опционально)

---

## СОВМЕСТИМОСТЬ

### Существующий функционал
- ✅ Все REST API endpoints работают
- ✅ WebSocket работает
- ✅ Голосовые сообщения работают
- ✅ Видеозвонки работают

### Новый функционал
- ✅ Telegram аутентификация
- ✅ Автоматическое создание пользователя
- ✅ Интеграция с Telegram UI

---

## ПОРЯДОК РАЗРАБОТКИ

1. **Backend** - Telegram auth (этап 2)
2. **Frontend** - Telegram интеграция (этап 3)
3. **Bot** - Настройка (этап 1)
4. **Тестирование** - Проверка работы (этап 4)

---

## РЕЗЮМЕ

Telegram MiniApp интеграция добавляет:
- Новый способ аутентификации (через Telegram)
- Новую точку входа (Telegram WebView)
- Адаптацию UI под Telegram стиль

Все существующие модули остаются без изменений, добавляется только Telegram аутентификация и адаптация UI.
