# СХЕМА БАЗЫ ДАННЫХ MVP МЕССЕНДЖЕРА

## ОБЩАЯ СТРУКТУРА

```
┌─────────────┐
│   users     │
└──────┬──────┘
       │
       │ (many-to-many)
       │
┌──────┴──────────────┐
│   chat_members      │
└──────┬──────────────┘
       │
       │ (many-to-one)
       │
┌──────┴──────┐
│    chats    │
└──────┬──────┘
       │
       │ (one-to-many)
       │
┌──────┴──────────────┐
│     messages        │
└──────┬──────────────┘
       │
       │ (one-to-many)
       │
┌──────┴──────────────────┐
│   message_deliveries    │
└─────────────────────────┘
```

---

## ТАБЛИЦА: users

**Назначение:** Хранение информации о пользователях системы

### Поля:

| Поле | Тип | Ограничения | Описание |
|------|-----|-------------|----------|
| `id` | UUID / BIGSERIAL | PRIMARY KEY, NOT NULL | Уникальный идентификатор пользователя |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email адрес (используется для входа) |
| `username` | VARCHAR(100) | UNIQUE, NOT NULL | Имя пользователя (отображаемое) |
| `password_hash` | VARCHAR(255) | NOT NULL | Хешированный пароль (bcrypt) |
| `avatar_url` | VARCHAR(500) | NULL | URL аватара (опционально, для будущего) |
| `is_online` | BOOLEAN | DEFAULT false | Статус онлайн/оффлайн |
| `last_seen_at` | TIMESTAMP | NULL | Время последней активности |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Дата регистрации |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Дата последнего обновления |

### Индексы:
- `idx_users_email` на `email` (для быстрого поиска при логине)
- `idx_users_username` на `username` (для поиска пользователей)

---

## ТАБЛИЦА: chats

**Назначение:** Хранение информации о чатах (1-на-1 для MVP)

### Поля:

| Поле | Тип | Ограничения | Описание |
|------|-----|-------------|----------|
| `id` | UUID / BIGSERIAL | PRIMARY KEY, NOT NULL | Уникальный идентификатор чата |
| `type` | VARCHAR(20) | NOT NULL, DEFAULT 'direct' | Тип чата ('direct' для 1-на-1, 'group' для будущего) |
| `name` | VARCHAR(255) | NULL | Название чата (NULL для 1-на-1, заполняется для групп) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Дата создания чата |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Дата последнего обновления (обновляется при новом сообщении) |
| `last_message_at` | TIMESTAMP | NULL | Время последнего сообщения (для сортировки списка чатов) |

### Индексы:
- `idx_chats_updated_at` на `updated_at` (для сортировки чатов)
- `idx_chats_last_message_at` на `last_message_at` (для быстрой сортировки)

### Ограничения:
- Для MVP: `type = 'direct'` (только 1-на-1 чаты)
- В будущем: можно добавить групповые чаты

---

## ТАБЛИЦА: chat_members

**Назначение:** Связь пользователей с чатами (junction table)

### Поля:

| Поле | Тип | Ограничения | Описание |
|------|-----|-------------|----------|
| `id` | UUID / BIGSERIAL | PRIMARY KEY, NOT NULL | Уникальный идентификатор записи |
| `chat_id` | UUID / BIGINT | NOT NULL, FOREIGN KEY → chats.id | ID чата |
| `user_id` | UUID / BIGINT | NOT NULL, FOREIGN KEY → users.id | ID пользователя |
| `role` | VARCHAR(20) | NOT NULL, DEFAULT 'member' | Роль в чате ('member', 'admin' для будущего) |
| `joined_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Дата присоединения к чату |
| `left_at` | TIMESTAMP | NULL | Дата выхода из чата (NULL если активен) |

### Индексы:
- `idx_chat_members_chat_id` на `chat_id`
- `idx_chat_members_user_id` на `user_id`
- `UNIQUE (chat_id, user_id)` - один пользователь не может быть дважды в одном чате

### Ограничения:
- Для MVP: в каждом чате ровно 2 участника (CHECK constraint или валидация в приложении)
- `left_at IS NULL` означает активное участие

---

## ТАБЛИЦА: messages

**Назначение:** Хранение сообщений в чатах

### Поля:

| Поле | Тип | Ограничения | Описание |
|------|-----|-------------|----------|
| `id` | UUID / BIGSERIAL | PRIMARY KEY, NOT NULL | Уникальный идентификатор сообщения |
| `chat_id` | UUID / BIGINT | NOT NULL, FOREIGN KEY → chats.id | ID чата, в котором сообщение |
| `user_id` | UUID / BIGINT | NOT NULL, FOREIGN KEY → users.id | ID отправителя |
| `content` | TEXT | NOT NULL | Текст сообщения |
| `message_type` | VARCHAR(20) | NOT NULL, DEFAULT 'text' | Тип сообщения ('text', 'image', 'file' для будущего) |
| `reply_to_id` | UUID / BIGINT | NULL, FOREIGN KEY → messages.id | ID сообщения, на которое ответ (для будущего) |
| `is_edited` | BOOLEAN | DEFAULT false | Флаг редактирования (для будущего) |
| `is_deleted` | BOOLEAN | DEFAULT false | Флаг удаления (soft delete) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Время отправки |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Время последнего обновления |

### Индексы:
- `idx_messages_chat_id` на `chat_id` (для получения сообщений чата)
- `idx_messages_user_id` на `user_id` (для истории пользователя)
- `idx_messages_created_at` на `created_at` (для сортировки по времени)
- `idx_messages_chat_created` на `(chat_id, created_at)` (композитный, для быстрого получения сообщений чата)

### Ограничения:
- `content` не может быть пустым (CHECK LENGTH(content) > 0)
- `reply_to_id` должен ссылаться на сообщение из того же чата (валидация в приложении)

---

## ТАБЛИЦА: message_deliveries

**Назначение:** Отслеживание статуса доставки сообщений каждому получателю

### Поля:

| Поле | Тип | Ограничения | Описание |
|------|-----|-------------|----------|
| `id` | UUID / BIGSERIAL | PRIMARY KEY, NOT NULL | Уникальный идентификатор записи |
| `message_id` | UUID / BIGINT | NOT NULL, FOREIGN KEY → messages.id | ID сообщения |
| `user_id` | UUID / BIGINT | NOT NULL, FOREIGN KEY → users.id | ID получателя |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'sent' | Статус: 'sent', 'delivered', 'read' |
| `delivered_at` | TIMESTAMP | NULL | Время доставки (когда статус стал 'delivered') |
| `read_at` | TIMESTAMP | NULL | Время прочтения (когда статус стал 'read') |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Время создания записи |

### Индексы:
- `idx_message_deliveries_message_id` на `message_id`
- `idx_message_deliveries_user_id` на `user_id`
- `idx_message_deliveries_status` на `status`
- `UNIQUE (message_id, user_id)` - одна запись на сообщение-пользователя

### Ограничения:
- `status` IN ('sent', 'delivered', 'read')
- Если `status = 'delivered'`, то `delivered_at IS NOT NULL`
- Если `status = 'read'`, то `read_at IS NOT NULL` и `delivered_at IS NOT NULL`

---

## СВЯЗИ МЕЖДУ ТАБЛИЦАМИ

### 1. users ↔ chat_members
- **Тип:** One-to-Many
- **Описание:** Один пользователь может быть участником многих чатов
- **FK:** `chat_members.user_id` → `users.id`
- **ON DELETE:** CASCADE (если пользователь удален, удаляются его участия в чатах)

### 2. chats ↔ chat_members
- **Тип:** One-to-Many
- **Описание:** Один чат может иметь много участников
- **FK:** `chat_members.chat_id` → `chats.id`
- **ON DELETE:** CASCADE (если чат удален, удаляются все участия)

### 3. chats ↔ messages
- **Тип:** One-to-Many
- **Описание:** Один чат может содержать много сообщений
- **FK:** `messages.chat_id` → `chats.id`
- **ON DELETE:** CASCADE (если чат удален, удаляются все сообщения)

### 4. users ↔ messages
- **Тип:** One-to-Many
- **Описание:** Один пользователь может отправить много сообщений
- **FK:** `messages.user_id` → `users.id`
- **ON DELETE:** SET NULL или RESTRICT (зависит от бизнес-логики)

### 5. messages ↔ message_deliveries
- **Тип:** One-to-Many
- **Описание:** Одно сообщение может иметь много записей о доставке (по одной на каждого получателя)
- **FK:** `message_deliveries.message_id` → `messages.id`
- **ON DELETE:** CASCADE (если сообщение удалено, удаляются записи о доставке)

### 6. users ↔ message_deliveries
- **Тип:** One-to-Many
- **Описание:** Один пользователь может иметь много записей о доставке сообщений
- **FK:** `message_deliveries.user_id` → `users.id`
- **ON DELETE:** CASCADE

### 7. messages ↔ messages (self-reference)
- **Тип:** One-to-Many (self)
- **Описание:** Сообщение может быть ответом на другое сообщение
- **FK:** `messages.reply_to_id` → `messages.id`
- **ON DELETE:** SET NULL (если исходное сообщение удалено, reply_to_id становится NULL)

---

## БИЗНЕС-ПРАВИЛА (Constraints)

### Для MVP (1-на-1 чаты):

1. **Количество участников в чате:**
   - В каждом чате типа 'direct' должно быть ровно 2 активных участника
   - Проверка: `COUNT(*) WHERE chat_id = X AND left_at IS NULL = 2`
   - Реализация: через триггер или валидацию в приложении

2. **Статус доставки:**
   - При создании сообщения создаются записи в `message_deliveries` для всех участников чата, кроме отправителя
   - Статус по умолчанию: 'sent'
   - При получении сообщения клиентом: статус → 'delivered'
   - При открытии чата пользователем: статус → 'read'

3. **Обновление чата:**
   - При создании нового сообщения обновляется `chats.updated_at` и `chats.last_message_at`
   - Реализация: через триггер или в приложении

4. **Soft Delete:**
   - Сообщения не удаляются физически, помечаются `is_deleted = true`
   - Удаленные сообщения не показываются в UI, но остаются в БД

---

## ПРИМЕРЫ ДАННЫХ

### users
```
id: 1
email: alice@example.com
username: alice
password_hash: $2b$10$...
is_online: true
last_seen_at: 2024-01-15 10:30:00
created_at: 2024-01-01 12:00:00
updated_at: 2024-01-15 10:30:00
```

### chats
```
id: 100
type: direct
name: NULL
created_at: 2024-01-10 14:00:00
updated_at: 2024-01-15 10:35:00
last_message_at: 2024-01-15 10:35:00
```

### chat_members
```
id: 1, chat_id: 100, user_id: 1, role: member, joined_at: 2024-01-10 14:00:00, left_at: NULL
id: 2, chat_id: 100, user_id: 2, role: member, joined_at: 2024-01-10 14:00:00, left_at: NULL
```

### messages
```
id: 1000
chat_id: 100
user_id: 1
content: "Привет! Как дела?"
message_type: text
reply_to_id: NULL
is_edited: false
is_deleted: false
created_at: 2024-01-15 10:35:00
updated_at: 2024-01-15 10:35:00
```

### message_deliveries
```
id: 1
message_id: 1000
user_id: 2
status: delivered
delivered_at: 2024-01-15 10:35:05
read_at: NULL
created_at: 2024-01-15 10:35:00
```

---

## ИНДЕКСЫ (Оптимизация)

### Основные индексы для производительности:

1. **Поиск пользователей:**
   - `users.email` (UNIQUE) - для логина
   - `users.username` (UNIQUE) - для поиска

2. **Получение чатов пользователя:**
   - `chat_members.user_id` - быстро найти все чаты пользователя
   - `chat_members.chat_id` - быстро найти участников чата

3. **Получение сообщений:**
   - `messages.chat_id, created_at` (композитный) - для пагинации сообщений чата
   - `messages.user_id` - для истории сообщений пользователя

4. **Статус доставки:**
   - `message_deliveries.message_id, user_id` (UNIQUE) - быстро найти статус для сообщения-пользователя
   - `message_deliveries.user_id, status` - для получения непрочитанных сообщений

5. **Сортировка чатов:**
   - `chats.last_message_at` - для сортировки списка чатов по последнему сообщению

---

## МИГРАЦИИ И ВЕРСИОНИРОВАНИЕ

### Порядок создания таблиц:

1. `users` (независимая таблица)
2. `chats` (независимая таблица)
3. `chat_members` (зависит от users и chats)
4. `messages` (зависит от chats и users)
5. `message_deliveries` (зависит от messages и users)

### Будущие расширения (не в MVP):

- Таблица `attachments` для файлов и медиа
- Таблица `reactions` для реакций на сообщения
- Поле `pinned_messages` в `chats` для закрепленных сообщений
- Таблица `notifications` для push-уведомлений

---

## РЕЗЮМЕ

### Таблицы:
1. **users** - пользователи системы
2. **chats** - чаты (1-на-1 для MVP)
3. **chat_members** - связь пользователей с чатами
4. **messages** - сообщения
5. **message_deliveries** - статус доставки сообщений

### Ключевые особенности:
- ✅ Timestamps везде (created_at, updated_at)
- ✅ Статус доставки через отдельную таблицу
- ✅ Soft delete для сообщений
- ✅ Готовность к расширению (групповые чаты, файлы)
- ✅ Оптимизированные индексы для быстрых запросов
- ✅ UUID или BIGSERIAL для ID (на выбор)

### Связи:
- users ↔ chat_members (many-to-many через junction)
- chats ↔ messages (one-to-many)
- messages ↔ message_deliveries (one-to-many)
- Все связи с правильными FOREIGN KEY и ON DELETE правилами
