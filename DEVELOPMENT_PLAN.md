# ПЛАН РАЗРАБОТКИ MVP МЕССЕНДЖЕРА

## СТРУКТУРА ПРОЕКТА

```
Messager/
├── backend/              # NestJS приложение
│   ├── src/
│   │   ├── auth/        # Модуль аутентификации
│   │   ├── users/       # Модуль пользователей
│   │   ├── chats/       # Модуль чатов
│   │   ├── messages/    # Модуль сообщений
│   │   └── websocket/   # WebSocket gateway
│   ├── prisma/          # Prisma схемы и миграции
│   └── package.json
│
├── frontend-web/        # React + Vite приложение
│   ├── src/
│   │   ├── components/  # React компоненты
│   │   ├── pages/       # Страницы
│   │   ├── services/    # API и WebSocket клиенты
│   │   ├── hooks/       # Custom hooks
│   │   └── types/       # TypeScript типы
│   └── package.json
│
├── mobile/              # React Native (Expo) приложение
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── services/
│   │   └── types/
│   └── package.json
│
└── README.md
```

---

## ЭТАП 1: BACKEND (NestJS)

### 1.1 Инициализация проекта
- [ ] Создать NestJS проект
- [ ] Настроить TypeScript конфигурацию
- [ ] Установить зависимости: @nestjs/websockets, socket.io, @prisma/client, prisma

### 1.2 База данных (PostgreSQL + Prisma)
- [ ] Настроить Prisma
- [ ] Создать схему БД:
  - User (id, email, username, password, createdAt, updatedAt)
  - Chat (id, name, type, createdAt, updatedAt)
  - ChatMember (chatId, userId, role, joinedAt)
  - Message (id, chatId, userId, content, createdAt, updatedAt)
- [ ] Создать миграции
- [ ] Настроить PrismaService

### 1.3 Модуль аутентификации
- [ ] AuthModule с JWT стратегией
- [ ] Регистрация (POST /auth/register)
- [ ] Логин (POST /auth/login)
- [ ] Валидация данных (class-validator)
- [ ] Хеширование паролей (bcrypt)

### 1.4 Модуль пользователей
- [ ] UsersModule
- [ ] Получение профиля (GET /users/me)
- [ ] Поиск пользователей (GET /users/search)

### 1.5 Модуль чатов
- [ ] ChatsModule
- [ ] Создание чата (POST /chats)
- [ ] Получение списка чатов (GET /chats)
- [ ] Получение чата по ID (GET /chats/:id)
- [ ] Добавление участника (POST /chats/:id/members)

### 1.6 Модуль сообщений
- [ ] MessagesModule
- [ ] Получение сообщений чата (GET /messages?chatId=...)
- [ ] Отправка сообщения (POST /messages)

### 1.7 WebSocket Gateway
- [ ] WebSocketGateway с Socket.io
- [ ] Аутентификация через JWT в WebSocket
- [ ] События:
  - message:send - отправка сообщения
  - message:received - получение сообщения
  - user:typing - индикатор печати
  - user:online/offline - статус пользователя

### 1.8 Конфигурация
- [ ] Переменные окружения (.env)
- [ ] CORS настройки
- [ ] Глобальные пайпы и фильтры

---

## ЭТАП 2: FRONTEND WEB (React + Vite)

### 2.1 Инициализация проекта
- [ ] Создать Vite + React + TypeScript проект
- [ ] Настроить TailwindCSS
- [ ] Установить зависимости: socket.io-client, axios, react-router-dom

### 2.2 Структура и типы
- [ ] Определить TypeScript интерфейсы (User, Chat, Message)
- [ ] Настроить структуру папок

### 2.3 API сервисы
- [ ] HTTP клиент (axios) с базовым URL
- [ ] AuthService (register, login, logout)
- [ ] ChatService (getChats, createChat, getChat)
- [ ] MessageService (getMessages, sendMessage)
- [ ] WebSocketService (подключение, события)

### 2.4 Компоненты UI
- [ ] Layout компонент
- [ ] Форма регистрации
- [ ] Форма логина
- [ ] Список чатов
- [ ] Окно чата
- [ ] Список сообщений
- [ ] Поле ввода сообщения
- [ ] Индикатор печати

### 2.5 Страницы
- [ ] Страница регистрации (/register)
- [ ] Страница логина (/login)
- [ ] Главная страница с чатами (/)
- [ ] Страница чата (/chat/:id)

### 2.6 State Management
- [ ] Context API для аутентификации
- [ ] Context API для WebSocket соединения
- [ ] Локальное состояние для чатов и сообщений

### 2.7 Стилизация
- [ ] TailwindCSS конфигурация
- [ ] Адаптивный дизайн
- [ ] Базовая тема

---

## ЭТАП 3: MOBILE (React Native Expo)

### 3.1 Инициализация проекта
- [ ] Создать Expo проект
- [ ] Настроить TypeScript
- [ ] Установить зависимости: socket.io-client, axios, @react-navigation

### 3.2 Структура
- [ ] Адаптировать типы из Web версии
- [ ] Создать структуру папок (screens, components, services)

### 3.3 API сервисы
- [ ] Адаптировать сервисы из Web версии
- [ ] Настроить WebSocket клиент

### 3.4 Экраны
- [ ] Экран регистрации
- [ ] Экран логина
- [ ] Экран списка чатов
- [ ] Экран чата

### 3.5 Навигация
- [ ] React Navigation setup
- [ ] Stack Navigator для auth/chat flow

### 3.6 UI компоненты
- [ ] Адаптировать компоненты под мобильный UI
- [ ] Использовать React Native компоненты

---

## ЭТАП 4: ИНТЕГРАЦИЯ И ТЕСТИРОВАНИЕ

### 4.1 Backend тестирование
- [ ] Проверить все API endpoints
- [ ] Проверить WebSocket события
- [ ] Проверить аутентификацию

### 4.2 Frontend Web тестирование
- [ ] Проверить регистрацию/логин
- [ ] Проверить создание чатов
- [ ] Проверить отправку/получение сообщений в реальном времени
- [ ] Проверить WebSocket соединение

### 4.3 Mobile тестирование
- [ ] Проверить на Android эмуляторе/устройстве
- [ ] Проверить все функции как в Web версии

### 4.4 Интеграционное тестирование
- [ ] Проверить взаимодействие Web и Mobile клиентов
- [ ] Проверить синхронизацию сообщений

---

## ТЕХНИЧЕСКИЕ ДЕТАЛИ

### Backend API Endpoints:
```
POST   /auth/register     - Регистрация
POST   /auth/login        - Логин
GET    /users/me          - Текущий пользователь
GET    /users/search      - Поиск пользователей
GET    /chats             - Список чатов
POST   /chats             - Создать чат
GET    /chats/:id         - Получить чат
POST   /chats/:id/members - Добавить участника
GET    /messages          - Получить сообщения (query: chatId)
POST   /messages          - Отправить сообщение
```

### WebSocket Events:
```
Client → Server:
  - message:send (chatId, content)
  - user:typing (chatId, isTyping)

Server → Client:
  - message:received (message)
  - user:typing (userId, chatId, isTyping)
  - user:online (userId)
  - user:offline (userId)
```

### Безопасность:
- JWT токены для HTTP и WebSocket
- Хеширование паролей (bcrypt)
- Валидация входных данных
- CORS настройки

---

## ПОРЯДОК РАЗРАБОТКИ

1. **Backend полностью** (этап 1)
2. **Frontend Web** (этап 2)
3. **Mobile** (этап 3)
4. **Тестирование и интеграция** (этап 4)

---

## ЧТО НЕ ВХОДИТ В MVP

- ❌ Видеозвонки (WebRTC)
- ❌ E2EE шифрование
- ❌ Файлы и медиа
- ❌ Групповые чаты (только 1-to-1)
- ❌ Push уведомления
- ❌ История сообщений (базовая загрузка есть)

---

## СЛЕДУЮЩИЕ ШАГИ ПОСЛЕ MVP

- Групповые чаты
- Файлы и изображения
- Push уведомления
- WebRTC видеозвонки
- E2EE шифрование
- Поиск по сообщениям
