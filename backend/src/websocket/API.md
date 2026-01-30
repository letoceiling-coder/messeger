# WebSocket API Документация

## Подключение

### URL
```
ws://localhost:3000
```

### Аутентификация
Токен передается при подключении через:
- Query параметр: `ws://localhost:3000?token=YOUR_JWT_TOKEN`
- Auth объект: `socket.auth.token = YOUR_JWT_TOKEN`

### Пример подключения (JavaScript)
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// Или через query
const socket = io('http://localhost:3000?token=YOUR_JWT_TOKEN');
```

---

## События

### Клиент → Сервер

#### `message:send`
Отправка сообщения в чат

**Данные:**
```json
{
  "chatId": "uuid",
  "content": "Текст сообщения"
}
```

**Пример:**
```javascript
socket.emit('message:send', {
  chatId: 'chat-uuid',
  content: 'Привет!'
});
```

**Ответы:**
- Успех: Событие `message:received` отправляется всем участникам чата
- Ошибка: Событие `error` с описанием ошибки

---

#### `message:delivered`
Подтверждение получения сообщения

**Данные:**
```json
{
  "messageId": "message-uuid"
}
```

**Пример:**
```javascript
socket.emit('message:delivered', {
  messageId: 'message-uuid'
});
```

**Ответы:**
- Успех: Событие `message:delivery_status` отправляется отправителю

---

### Сервер → Клиент

#### `message:received`
Новое сообщение в чате

**Данные:**
```json
{
  "id": "message-uuid",
  "chatId": "chat-uuid",
  "userId": "sender-uuid",
  "content": "Текст сообщения",
  "createdAt": "2024-01-15T10:35:00.000Z"
}
```

**Пример:**
```javascript
socket.on('message:received', (message) => {
  console.log('Новое сообщение:', message);
  // Обновить UI
});
```

---

#### `message:delivery_status`
Статус доставки сообщения

**Данные:**
```json
{
  "messageId": "message-uuid",
  "userId": "recipient-uuid",
  "status": "delivered"
}
```

**Пример:**
```javascript
socket.on('message:delivery_status', (status) => {
  console.log('Статус доставки:', status);
  // Обновить UI (галочка доставлено)
});
```

---

#### `user:online`
Пользователь подключился

**Данные:**
```json
{
  "userId": "user-uuid"
}
```

**Пример:**
```javascript
socket.on('user:online', (data) => {
  console.log('Пользователь онлайн:', data.userId);
  // Обновить статус в UI
});
```

---

#### `user:offline`
Пользователь отключился

**Данные:**
```json
{
  "userId": "user-uuid"
}
```

**Пример:**
```javascript
socket.on('user:offline', (data) => {
  console.log('Пользователь оффлайн:', data.userId);
  // Обновить статус в UI
});
```

---

#### `error`
Ошибка при обработке события

**Данные:**
```json
{
  "message": "Описание ошибки"
}
```

**Пример:**
```javascript
socket.on('error', (error) => {
  console.error('Ошибка:', error.message);
  // Показать уведомление пользователю
});
```

---

## Полный пример использования

```javascript
import { io } from 'socket.io-client';

// Подключение
const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('accessToken')
  }
});

// Обработка подключения
socket.on('connect', () => {
  console.log('Подключен к серверу');
});

// Обработка отключения
socket.on('disconnect', () => {
  console.log('Отключен от сервера');
});

// Получение нового сообщения
socket.on('message:received', (message) => {
  console.log('Новое сообщение:', message);
  // Добавить сообщение в UI
  addMessageToUI(message);
});

// Статус доставки
socket.on('message:delivery_status', (status) => {
  console.log('Статус доставки:', status);
  // Обновить статус сообщения в UI
  updateMessageStatus(status.messageId, status.status);
});

// Пользователь онлайн
socket.on('user:online', (data) => {
  updateUserStatus(data.userId, 'online');
});

// Пользователь оффлайн
socket.on('user:offline', (data) => {
  updateUserStatus(data.userId, 'offline');
});

// Ошибки
socket.on('error', (error) => {
  console.error('Ошибка:', error.message);
  showError(error.message);
});

// Отправка сообщения
function sendMessage(chatId, content) {
  socket.emit('message:send', {
    chatId,
    content
  });
}

// Подтверждение получения
function markAsDelivered(messageId) {
  socket.emit('message:delivered', {
    messageId
  });
}

// При получении сообщения автоматически подтверждаем
socket.on('message:received', (message) => {
  addMessageToUI(message);
  // Подтверждаем получение
  markAsDelivered(message.id);
});
```

---

## React Native (Expo) пример

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: await AsyncStorage.getItem('accessToken')
  },
  transports: ['websocket']
});

socket.on('message:received', (message) => {
  // Обновить состояние
  setMessages(prev => [...prev, message]);
});
```

---

## Обработка ошибок

### Типы ошибок:

1. **Не авторизован:**
   ```json
   {"message": "Не авторизован"}
   ```
   Решение: Проверить JWT токен

2. **Не участник чата:**
   ```json
   {"message": "Вы не являетесь участником этого чата"}
   ```
   Решение: Проверить права доступа

3. **Валидация:**
   ```json
   {"message": "chatId обязателен, Сообщение не может быть пустым"}
   ```
   Решение: Проверить формат данных

---

## Лучшие практики

1. **Переподключение:**
   ```javascript
   socket.on('disconnect', () => {
     // Автоматическое переподключение
     socket.connect();
   });
   ```

2. **Обработка ошибок:**
   ```javascript
   socket.on('error', (error) => {
     // Логирование и уведомление пользователя
     logError(error);
     showUserNotification(error.message);
   });
   ```

3. **Подтверждение доставки:**
   ```javascript
   // Всегда подтверждайте получение сообщений
   socket.on('message:received', (message) => {
     handleMessage(message);
     socket.emit('message:delivered', { messageId: message.id });
   });
   ```

4. **Управление состоянием:**
   ```javascript
   // Храните список подключенных пользователей
   const onlineUsers = new Set();
   
   socket.on('user:online', (data) => {
     onlineUsers.add(data.userId);
   });
   
   socket.on('user:offline', (data) => {
     onlineUsers.delete(data.userId);
   });
   ```

---

## Тестирование

### Использование socket.io-client в Node.js

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('Connected');
  
  // Отправка сообщения
  socket.emit('message:send', {
    chatId: 'test-chat-id',
    content: 'Тестовое сообщение'
  });
});

socket.on('message:received', (message) => {
  console.log('Received:', message);
});
```
