# НАСТРОЙКА TELEGRAM BOT И MINIAPP

## СОЗДАНИЕ TELEGRAM BOT

### Шаг 1: Создание Bot через @BotFather

1. Откройте Telegram и найдите **@BotFather**
2. Отправьте команду `/newbot`
3. Следуйте инструкциям:
   - Введите имя бота (например: "My Messenger Bot")
   - Введите username бота (должен заканчиваться на `bot`, например: `mymessenger_bot`)
4. Сохраните **Bot Token** (например: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Шаг 2: Настройка MiniApp

1. Отправьте `/newapp` в @BotFather
2. Выберите созданного бота
3. Укажите название MiniApp
4. Укажите описание
5. Укажите URL MiniApp: `https://yourdomain.com/telegram`
6. Загрузите иконку (опционально)

### Шаг 3: Настройка Backend

Добавьте Bot Token в `backend/.env`:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

---

## НАСТРОЙКА FRONTEND

### URL для MiniApp

MiniApp должен быть доступен по HTTPS:
- Development: `https://yourdomain.com/telegram`
- Production: `https://yourdomain.com/telegram`

### Маршрут

Маршрут `/telegram` уже добавлен в `frontend-web/src/App.tsx`:
```tsx
<Route path="/telegram" element={<TelegramApp />} />
```

---

## ТЕСТИРОВАНИЕ

### 1. Локальное тестирование

Для локального тестирования используйте ngrok или аналогичный сервис:

```bash
# Установить ngrok
npm install -g ngrok

# Запустить туннель
ngrok http 5173

# Использовать HTTPS URL в BotFather
```

### 2. Тестирование в Telegram

1. Откройте Telegram
2. Найдите вашего бота
3. Нажмите на кнопку MiniApp (или отправьте `/start`)
4. MiniApp должен открыться в WebView
5. Проверьте автоматическую аутентификацию

---

## АУТЕНТИФИКАЦИЯ

### Поток работы

1. Пользователь открывает MiniApp в Telegram
2. Telegram передает `initData` в WebView
3. Frontend получает `initData` через `window.Telegram.WebApp.initData`
4. Frontend отправляет `initData` на Backend: `POST /auth/telegram`
5. Backend проверяет подпись `initData` (HMAC SHA-256)
6. Backend создает/обновляет пользователя по `telegramId`
7. Backend возвращает JWT токен
8. Frontend сохраняет токен и перенаправляет на главную страницу

### Проверка подписи

Backend проверяет:
- Подпись `initData` (HMAC SHA-256 с Bot Token)
- Время создания (не старше 24 часов)
- Наличие данных пользователя

---

## ОБМЕН ДАННЫМИ

### От Frontend к Bot

```typescript
window.Telegram.WebApp.sendData('some data');
```

### От Bot к Frontend

```typescript
window.Telegram.WebApp.onEvent('main_button_pressed', () => {
  // Обработка события
});
```

---

## UI АДАПТАЦИЯ

### Telegram WebApp API

Используйте Telegram WebApp API для адаптации UI:

```typescript
// Развернуть на весь экран
window.Telegram.WebApp.expand();

// Изменить цвет темы
window.Telegram.WebApp.setHeaderColor('#4f46e5');

// Показать кнопку
window.Telegram.WebApp.MainButton.show();
window.Telegram.WebApp.MainButton.setText('Отправить');
```

---

## БЕЗОПАСНОСТЬ

### Важные моменты

1. **Bot Token** должен быть секретным
2. **initData** валиден только 24 часа
3. Проверка подписи обязательна на Backend
4. Используйте HTTPS для MiniApp URL

### Проверка в Backend

```typescript
// TelegramAuthService проверяет:
- HMAC SHA-256 подпись
- Время создания (не старше 24 часов)
- Наличие данных пользователя
```

---

## РЕШЕНИЕ ПРОБЛЕМ

### MiniApp не открывается
- Проверьте URL в BotFather
- Убедитесь, что URL доступен по HTTPS
- Проверьте CORS настройки

### Ошибка аутентификации
- Проверьте Bot Token в .env
- Проверьте логи Backend
- Убедитесь, что initData валиден

### Пользователь не создается
- Проверьте логи Backend
- Убедитесь, что telegramId уникален
- Проверьте схему БД

---

## PRODUCTION

### Рекомендации

1. Используйте HTTPS для MiniApp
2. Настройте домен для MiniApp
3. Используйте CDN для статических файлов
4. Настройте мониторинг ошибок
5. Логируйте события аутентификации

---

## ДОПОЛНИТЕЛЬНЫЕ ВОЗМОЖНОСТИ

### Команды Bot

Добавьте команды в @BotFather:
- `/start` - запуск MiniApp
- `/help` - помощь
- `/chats` - список чатов (через Bot API)

### Уведомления

Используйте Telegram Bot API для отправки уведомлений:
```typescript
// Отправка уведомления о новом сообщении
await telegramBot.sendMessage(user.telegramId, 'Новое сообщение');
```

---

## ДОКУМЕНТАЦИЯ

- Telegram Bot API: https://core.telegram.org/bots/api
- Telegram MiniApp: https://core.telegram.org/bots/webapps
- Telegram WebApp API: https://core.telegram.org/bots/webapps#initializing-mini-apps
