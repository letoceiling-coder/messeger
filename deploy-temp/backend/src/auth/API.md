# API Авторизации

## Endpoints

### POST /auth/register
Регистрация нового пользователя

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

**Response (201 Created):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username"
  }
}
```

**Ошибки:**
- `400 Bad Request` - невалидные данные (email формат, длина пароля, и т.д.)
- `409 Conflict` - пользователь с таким email или username уже существует

---

### POST /auth/login
Вход в систему

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username"
  }
}
```

**Ошибки:**
- `400 Bad Request` - невалидные данные
- `401 Unauthorized` - неверный email или пароль

---

## Использование токена

После получения `accessToken`, используйте его в заголовке для защищенных endpoints:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Примеры использования

### cURL

**Регистрация:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }'
```

**Логин:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Защищенный endpoint (пример):**
```bash
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### JavaScript (fetch)

```javascript
// Регистрация
const registerResponse = await fetch('http://localhost:3000/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    username: 'testuser',
    password: 'password123'
  })
});

const { accessToken, user } = await registerResponse.json();

// Использование токена
const protectedResponse = await fetch('http://localhost:3000/users/me', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

## Валидация

### Email
- Должен быть валидным email форматом
- Пример: `user@example.com`

### Username
- Минимум 3 символа
- Максимум 50 символов
- Только буквы (a-z, A-Z), цифры (0-9) и подчеркивание (_)
- Примеры: `user123`, `test_user`, `User123`

### Password
- Минимум 6 символов
- Максимум 100 символов
