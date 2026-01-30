# АРХИТЕКТУРА MVP МЕССЕНДЖЕРА

## ОБЩАЯ СХЕМА СИСТЕМЫ

```
┌─────────────────────────────────────────────────────────────────┐
│                         КЛИЕНТСКИЕ ПРИЛОЖЕНИЯ                    │
├──────────────────────────────┬──────────────────────────────────┤
│     FRONTEND WEB              │        MOBILE (Android)          │
│  (React + Vite + TS)          │    (React Native + Expo)        │
│                               │                                  │
│  ┌──────────────────────┐    │  ┌──────────────────────┐        │
│  │  UI Components       │    │  │  UI Screens          │        │
│  │  - Auth Forms        │    │  │  - Auth Screens      │        │
│  │  - Chat List         │    │  │  - Chat List         │        │
│  │  - Message Window    │    │  │  - Chat Screen       │        │
│  └──────────────────────┘    │  └──────────────────────┘        │
│           │                   │           │                       │
│  ┌──────────────────────┐    │  ┌──────────────────────┐        │
│  │  Services Layer      │    │  │  Services Layer      │        │
│  │  - HTTP Client       │    │  │  - HTTP Client       │        │
│  │  - WebSocket Client  │    │  │  - WebSocket Client  │        │
│  └──────────────────────┘    │  └──────────────────────┘        │
└───────────┬───────────────────┴───────────┬──────────────────────┘
            │                               │
            │  HTTPS / WSS                  │  HTTPS / WSS
            │                               │
┌───────────┴───────────────────────────────┴──────────────────────┐
│                         BACKEND (NestJS)                         │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              API GATEWAY / HTTP SERVER                    │  │
│  │  - REST API Endpoints                                     │  │
│  │  - JWT Authentication Middleware                           │  │
│  │  - CORS, Validation, Error Handling                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
│  ┌────────────────────────┼──────────────────────────────────┐  │
│  │                        │                                  │  │
│  │  ┌──────────────┐      │      ┌──────────────────────┐   │  │
│  │  │ Auth Module  │      │      │  WebSocket Gateway   │   │  │
│  │  │ - Register   │      │      │  (Socket.io)         │   │  │
│  │  │ - Login      │      │      │  - JWT Auth          │   │  │
│  │  │ - JWT        │      │      │  - Event Handlers    │   │  │
│  │  └──────────────┘      │      │  - Room Management   │   │  │
│  │                        │      └──────────────────────┘   │  │
│  │  ┌──────────────┐      │                │                │  │
│  │  │ Users Module │      │                │                │  │
│  │  │ - Profile    │      │                │                │  │
│  │  │ - Search     │      │                │                │  │
│  │  └──────────────┘      │                │                │  │
│  │                        │                │                │  │
│  │  ┌──────────────┐      │      ┌──────────────────────┐   │  │
│  │  │ Chats Module │      │      │  Messages Module      │   │  │
│  │  │ - Create     │      │      │  - Send Message       │   │  │
│  │  │ - List       │      │      │  - Get Messages       │   │  │
│  │  │ - Get        │      │      │  - WebSocket Events   │   │  │
│  │  └──────────────┘      │      └──────────────────────┘   │  │
│  │                        │                                  │  │
│  └────────────────────────┼──────────────────────────────────┘  │
│                           │                                      │
│  ┌────────────────────────┴──────────────────────────────────┐  │
│  │              PRISMA ORM SERVICE LAYER                      │  │
│  │  - Database Queries                                        │  │
│  │  - Transaction Management                                  │  │
│  │  - Data Validation                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            │ SQL Queries
                            │
┌───────────────────────────┴──────────────────────────────────────┐
│                    POSTGRESQL DATABASE                            │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │    users     │  │    chats     │  │   messages   │           │
│  │              │  │              │  │              │           │
│  │ id           │  │ id           │  │ id           │           │
│  │ email        │  │ name         │  │ chatId       │           │
│  │ username     │  │ type         │  │ userId       │           │
│  │ password     │  │ createdAt    │  │ content      │           │
│  │ createdAt    │  │ updatedAt    │  │ createdAt    │           │
│  │ updatedAt    │  │              │  │ updatedAt    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              chat_members (junction table)                  │ │
│  │  chatId, userId, role, joinedAt                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

---

## КОМПОНЕНТЫ И ИХ НАЗНАЧЕНИЕ

### 1. КЛИЕНТСКИЕ ПРИЛОЖЕНИЯ

#### Frontend Web (React + Vite)
**Слои:**
- **UI Layer**: React компоненты для отображения интерфейса
- **Services Layer**: HTTP клиент (axios) и WebSocket клиент (socket.io-client)
- **State Management**: React Context API для глобального состояния

**Компоненты:**
- Auth Forms (регистрация/логин)
- Chat List (список чатов пользователя)
- Message Window (окно чата с сообщениями)
- Message Input (поле ввода сообщения)

#### Mobile (React Native + Expo)
**Слои:**
- **UI Layer**: React Native компоненты и экраны
- **Services Layer**: Те же сервисы, что и в Web (адаптированные под мобильную платформу)
- **Navigation**: React Navigation для навигации между экранами

**Экраны:**
- Auth Screens (регистрация/логин)
- Chat List Screen
- Chat Screen (окно чата)

---

### 2. BACKEND (NestJS)

#### API Gateway / HTTP Server
**Назначение:**
- Принимает HTTP запросы от клиентов
- Обрабатывает REST API endpoints
- Применяет middleware (JWT auth, validation, CORS)

**Технологии:**
- NestJS HTTP Server
- Express под капотом

#### Модули Backend

**Auth Module:**
- Регистрация пользователей
- Аутентификация (логин)
- Генерация JWT токенов
- Валидация токенов

**Users Module:**
- Получение профиля текущего пользователя
- Поиск пользователей по имени/email

**Chats Module:**
- Создание нового чата
- Получение списка чатов пользователя
- Получение информации о конкретном чате
- Управление участниками чата

**Messages Module:**
- Отправка сообщений (через REST)
- Получение истории сообщений
- Интеграция с WebSocket для realtime доставки

**WebSocket Gateway:**
- Управление WebSocket соединениями
- Аутентификация через JWT в WebSocket handshake
- Обработка realtime событий
- Управление комнатами (rooms) для чатов

#### Prisma ORM Service Layer
**Назначение:**
- Абстракция над базой данных
- Типобезопасные запросы
- Миграции схемы БД
- Транзакции

---

### 3. БАЗА ДАННЫХ (PostgreSQL)

**Таблицы:**
- `users` - пользователи системы
- `chats` - чаты (1-to-1 или групповые)
- `chat_members` - связь пользователей с чатами (many-to-many)
- `messages` - сообщения в чатах

---

## КОММУНИКАЦИЯ МЕЖДУ КОМПОНЕНТАМИ

### REST API (HTTP/HTTPS)

**Используется для:**
- Аутентификация (регистрация, логин)
- CRUD операции (создание чатов, получение списков)
- Получение истории сообщений
- Управление профилем

**Протокол:** HTTP/HTTPS
**Формат:** JSON
**Аутентификация:** JWT токен в заголовке `Authorization: Bearer <token>`

**Примеры запросов:**
```
POST /auth/register
POST /auth/login
GET  /users/me
GET  /chats
POST /chats
GET  /messages?chatId=123
POST /messages
```

**Поток аутентификации:**
```
1. Клиент → POST /auth/register → Backend
2. Backend → Проверка данных → Создание пользователя в БД
3. Backend → Генерация JWT → Возврат токена клиенту
4. Клиент → Сохранение токена → Использование в последующих запросах
```

---

### WebSocket (WSS)

**Используется для:**
- Realtime отправка и получение сообщений
- Индикатор печати (typing indicator)
- Статусы пользователей (online/offline)
- Мгновенные уведомления о новых сообщениях

**Протокол:** WebSocket Secure (WSS)
**Библиотека:** Socket.io
**Аутентификация:** JWT токен при установлении соединения

**События (Client → Server):**
```
message:send
  - chatId: string
  - content: string

user:typing
  - chatId: string
  - isTyping: boolean
```

**События (Server → Client):**
```
message:received
  - message: { id, chatId, userId, content, createdAt }

user:typing
  - userId: string
  - chatId: string
  - isTyping: boolean

user:online
  - userId: string

user:offline
  - userId: string
```

**Поток отправки сообщения:**
```
1. Клиент A → WebSocket: message:send { chatId, content }
2. Backend → Валидация → Сохранение в БД
3. Backend → Определение получателей (участники чата)
4. Backend → WebSocket: message:received → Клиент B
5. Backend → WebSocket: message:received → Клиент A (подтверждение)
```

**Управление комнатами:**
- Каждый чат = комната (room) в Socket.io
- При подключении клиент присоединяется к комнатам своих чатов
- Сообщения отправляются в комнату чата
- Все участники комнаты получают событие

---

## ПОТОК ДАННЫХ

### Регистрация и вход
```
1. Клиент → POST /auth/register { email, username, password }
2. Backend → Валидация → Хеширование пароля → Сохранение в БД
3. Backend → Генерация JWT → Возврат { token, user }
4. Клиент → Сохранение токена → Установка WebSocket соединения
5. Клиент → WebSocket: authenticate { token }
6. Backend → Валидация токена → Подключение к комнатам чатов пользователя
```

### Создание чата
```
1. Клиент → POST /chats { name?, userIds[] }
2. Backend → Создание записи в БД (chats, chat_members)
3. Backend → Возврат { chat }
4. Клиент → Обновление списка чатов
5. Клиент → WebSocket: join room (chatId)
```

### Отправка сообщения
```
Вариант 1 (через REST):
1. Клиент → POST /messages { chatId, content }
2. Backend → Сохранение в БД
3. Backend → WebSocket broadcast в комнату чата
4. Все участники получают message:received

Вариант 2 (через WebSocket):
1. Клиент → WebSocket: message:send { chatId, content }
2. Backend → Сохранение в БД
3. Backend → WebSocket broadcast в комнату чата
4. Все участники получают message:received
```

### Получение истории сообщений
```
1. Клиент → GET /messages?chatId=123&limit=50&offset=0
2. Backend → Запрос к БД через Prisma
3. Backend → Возврат { messages[] }
4. Клиент → Отображение сообщений
```

---

## АУТЕНТИФИКАЦИЯ И БЕЗОПАСНОСТЬ

### HTTP API
- JWT токен в заголовке `Authorization: Bearer <token>`
- Middleware проверяет токен перед доступом к защищенным endpoints
- Невалидный/отсутствующий токен → 401 Unauthorized

### WebSocket
- JWT токен передается при handshake (query параметр или заголовок)
- Gateway проверяет токен перед установкой соединения
- Невалидный токен → Отклонение соединения
- После успешной аутентификации → Подключение к комнатам пользователя

### База данных
- Пароли хранятся в хешированном виде (bcrypt)
- JWT токены содержат userId и expire time
- Все запросы к БД идут через Prisma (защита от SQL injection)

---

## МАСШТАБИРУЕМОСТЬ

### Текущая архитектура (MVP)
- Один Backend сервер
- Одна PostgreSQL база данных
- WebSocket соединения на одном сервере

### Потенциальные улучшения (не в MVP)
- Redis для управления WebSocket комнатами (multi-server)
- Message Queue (RabbitMQ/Kafka) для обработки сообщений
- Load Balancer для распределения нагрузки
- Replication БД для чтения
- CDN для статических файлов

---

## ЗАВИСИМОСТИ И ПОРЯДОК ЗАПУСКА

### Зависимости:
1. PostgreSQL должна быть запущена
2. Backend подключается к БД через Prisma
3. Frontend/Mobile подключаются к Backend

### Порядок запуска:
```
1. PostgreSQL → Запуск БД
2. Backend → npm run migrate (Prisma миграции)
3. Backend → npm run start (NestJS сервер)
4. Frontend Web → npm run dev (Vite dev server)
5. Mobile → expo start (Expo dev server)
```

---

## ОГРАНИЧЕНИЯ MVP

**Что НЕ реализовано:**
- ❌ Групповые чаты (только 1-to-1)
- ❌ Файлы и медиа
- ❌ Push уведомления
- ❌ Видеозвонки (WebRTC)
- ❌ E2EE шифрование
- ❌ Поиск по сообщениям
- ❌ Редактирование/удаление сообщений
- ❌ Read receipts (прочитано/не прочитано)

**Что реализовано:**
- ✅ Регистрация и аутентификация
- ✅ Создание 1-to-1 чатов
- ✅ Текстовые сообщения
- ✅ Realtime доставка через WebSocket
- ✅ История сообщений
- ✅ Индикатор печати (опционально)

---

## ТЕХНОЛОГИЧЕСКИЙ СТЕК

### Backend
- **Runtime**: Node.js
- **Framework**: NestJS
- **WebSocket**: Socket.io
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: JWT (jsonwebtoken)
- **Password**: bcrypt

### Frontend Web
- **Framework**: React
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **HTTP Client**: axios
- **WebSocket Client**: socket.io-client
- **Routing**: react-router-dom

### Mobile
- **Framework**: React Native
- **Platform**: Expo
- **Language**: TypeScript
- **HTTP Client**: axios
- **WebSocket Client**: socket.io-client
- **Navigation**: @react-navigation

---

## ЗАКЛЮЧЕНИЕ

Архитектура MVP мессенджера построена на принципах:
- **Разделение ответственности**: четкое разделение на модули
- **REST для CRUD**: стандартные операции через HTTP
- **WebSocket для realtime**: мгновенная доставка сообщений
- **Единая точка входа**: один Backend для Web и Mobile
- **Типобезопасность**: TypeScript везде, Prisma для БД
- **Масштабируемость**: возможность расширения без переписывания

Все компоненты взаимодействуют через четко определенные интерфейсы (REST API и WebSocket события), что позволяет независимо разрабатывать и тестировать каждую часть системы.
