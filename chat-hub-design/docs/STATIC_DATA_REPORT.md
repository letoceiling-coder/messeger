# Отчёт о статических данных

Документ перечисляет все статические (моковые и константные) данные в проекте. Для перехода на полностью динамические данные эти источники нужно заменить на API/WebSocket и локальное хранилище.

---

## 1. `src/data/mockData.ts`

### 1.1 Константы и хелперы (статическая логика)

| Имя | Описание | Где используется |
|-----|----------|-------------------|
| `avatarColors` | Массив цветов для генерации аватара по имени | Внутри mockData (getAvatarColor) |
| `getAvatarColor(name)` | Цвет аватара по первой букве имени | mockData (не экспортируется в другие файлы напрямую) |
| `placeholderImage` | `/placeholder.svg` для демо-медиа | generateMessages, generateChannelMessages и др. |
| `placeholderVideo` | URL демо-видео (Google Storage) | generateMessages |
| `stickerDataUrl(emoji)` | data URL SVG со стикером-эмодзи | generateMessages |

**Рекомендация:** В проде медиа — CDN/API; аватар — из профиля или генерация на бэкенде.

---

### 1.2 Текущий пользователь (User)

| Имя | Тип | Где используется |
|-----|-----|-------------------|
| `currentUser` | User | SettingsPage, ProfilePage, ChatListHeader, PostCommentsPage, CommentsSheet, ChannelPostFooter (currentUserId = 'user-1') |

**Содержимое (статическое):** id: 'user-1', name: 'Александр Иванов', username: 'alex_ivanov', phone: '+7 999 123-45-67', bio: 'Разработчик \| Москва', isOnline: true.

**Рекомендация:** После авторизации загружать профиль с API по токену/phone; id и имя — с бэкенда.

---

### 1.3 Настройки по умолчанию

| Имя | Тип | Где используется |
|-----|-----|-------------------|
| `defaultSettings` | Settings | SettingsPage (начальное состояние) |

**Содержимое:** theme: 'light', notifications: true, sounds: true, vibration: true, lastSeenPrivacy: 'everyone', profilePhotoPrivacy: 'everyone', fontSize: 'medium'.

**Рекомендация:** Загружать настройки с API или из localStorage с синхронизацией.

---

### 1.4 Контакты

| Имя | Тип | Где используется |
|-----|-----|-------------------|
| `contacts` | Contact[] | mockData (getContactById, getChatById, calls), ContactsContext (initialContacts) |

**Содержимое:** 10 контактов (Мария Петрова, Дмитрий Смирнов, Анна Козлова и т.д.) с id contact-1 … contact-10, телефонами, username, bio, isOnline, lastSeen.

**Рекомендация:** Список контактов — из API; ContactsContext инициализировать пустым или данными с бэкенда.

---

### 1.5 Чаты

| Имя | Тип | Где используется |
|-----|-----|-------------------|
| `chats` | Chat[] | mockData (getChatById), ChatsContext (initialChats) |

**Содержимое:** 8 личных чатов (chat-1 … chat-8), 2 бота (bot-1, bot-2), 2 канала (channel-1, channel-2) с lastMessage, unreadCount, isPinned, keyboard (у ботов), subscribersCount (у каналов) и т.д.

**Рекомендация:** Список чатов — из API; ChatsContext — загрузка при старте и обновление через WebSocket/API.

---

### 1.6 Сообщения

| Имя | Тип | Где используется |
|-----|-----|-------------------|
| `messagesByChat` | Record<string, Message[]> | mockData (getMessagesForChat) |
| `generateMessages(chatId, contactId)` | Message[] | Формирование messagesByChat для chat-1 … chat-8 |
| `generateBotMessages(chatId, botId)` | Message[] | messagesByChat для bot-1, bot-2 |
| `generateHelperBotMessages(chatId, botId)` | Message[] | messagesByChat для bot-2 |
| `generateChannelMessages(chatId, channelName)` | Message[] | messagesByChat для channel-1 |
| `generateNewsChannelMessages(chatId)` | Message[] | messagesByChat для channel-2 |
| `getMessagesForChat(chatId)` | Message[] | MessagesContext (fallback при первом запросе по chatId) |

**Содержимое:** Для каждого chatId — массив сообщений (текст, фото, видео, голос, видеокружок, файл, контакт, стикер, системное, у ботов — с buttons, в каналах — с views/reactions). senderId: 'user-1' для исходящих.

**Рекомендация:** Сообщения загружать по chatId с API (пагинация), новые — через WebSocket; MessagesContext хранит только кэш/состояние с сервера.

---

### 1.7 История звонков

| Имя | Тип | Где используется |
|-----|-----|-------------------|
| `calls` | Call[] | CallsPage, MainLayout |

**Содержимое:** 5 записей (call-1 … call-5): video/audio, outgoing/incoming/missed/declined, contact из contacts, timestamp, duration.

**Рекомендация:** История звонков — из API; отображать в CallsPage и бейдже непрочитанных в MainLayout из API.

---

### 1.8 Хелперы форматирования (логика, не данные)

| Имя | Описание | Где используется |
|-----|----------|-------------------|
| `getContactById(id)` | Поиск контакта по id в массиве contacts | mockData (getChatById не использует), PostCommentsPage, CommentsSheet |
| `getChatById(id)` | Поиск чата по id в массиве chats | mockData (внутри), нигде не импортируется (чаты из ChatsContext) |
| `formatLastSeen(date)` | «только что», «N мин. назад», «N ч. назад», «вчера», «N дн. назад» | ChatPage, ContactListItem |
| `formatMessageTime(date)` | Время в формате HH:MM (ru-RU) | ChatPage, PostCommentsPage, CommentsSheet, ChatListItem |
| `formatViews(views)` | 1.2K, 10K, 1M | ChannelPostFooter |
| `formatCallDuration(seconds)` | MM:SS или H:MM:SS | CallsPage |
| `getAvatarColor` | Цвет по имени (экспортируется) | Возможно в Avatar/других компонентах — при необходимости заменить на данные профиля |

**Рекомендация:** Форматтеры оставить; getContactById/getChatById заменить на выборку из контекстов или API.

---

## 2. `src/data/stickerPacks.ts`

### 2.1 Пакы стикеров

| Имя | Тип | Где используется |
|-----|-----|-------------------|
| `defaultStickerPacks` | StickerPack[] | StickerContext (начальное состояние паков и activePackId) |

**Содержимое:** 3 пака («Смайлики», «Жесты», «Эмоции»), каждый с 10 стикерами. URL стикеров — data URL SVG с эмодзи (функция `stickerImage(emoji)`).

**Рекомендация:** Список паков и стикеров — из API; StickerContext инициализировать из API или пустым с последующей подгрузкой.

### 2.2 Локальное хранилище (динамическое)

| Ключ | Описание |
|------|----------|
| `sticker-favorites` | ID избранных стикеров (getStoredFavorites, setStoredFavorites) |
| `sticker-recent` | ID недавно использованных (getStoredRecent, setStoredRecent), макс. 30 |

Данные уже динамические (localStorage). В проде при необходимости синхронизировать с API.

---

## 3. `src/context/AuthContext.tsx`

| Имя | Тип | Описание |
|-----|-----|----------|
| `TEST_SMS_CODE` | const '1234' | Код для тестирования входа; verifyCode принимает только 1234 |

**Рекомендация:** В проде убрать константу; verifyCode вызывать API проверки кода.

---

## 4. Жёстко заданные идентификаторы

| Место | Значение | Описание |
|-------|----------|----------|
| MessagesContext | `CURRENT_USER_ID = 'user-1'` | Используется при добавлении реакций (userIds). Заменить на текущего пользователя из AuthContext/User API. |
| ChannelPostFooter | `currentUserId = 'user-1'` (default prop) | Передаётся из ChatPage; лучше брать из контекста текущего пользователя. |

**Рекомендация:** Единый источник текущего пользователя (id) после авторизации — AuthContext + профиль с API.

---

## 5. Сводная таблица: что заменить для полностью динамических данных

| Данные | Сейчас | Нужно для продакшена |
|--------|--------|----------------------|
| Текущий пользователь (User) | currentUser в mockData | API профиля по токену/phone после авторизации |
| Чаты | initialChats из mockData → ChatsContext | API списка чатов + WebSocket обновлений |
| Сообщения | getMessagesForChat(chatId) из mockData → MessagesContext | API по chatId (пагинация) + WebSocket новых сообщений |
| Контакты | initialContacts из mockData → ContactsContext | API контактов |
| История звонков | calls из mockData | API истории звонков |
| Настройки | defaultSettings в SettingsPage | API или localStorage с синхронизацией |
| Стикер-паки | defaultStickerPacks в StickerContext | API паков и стикеров |
| Код входа | TEST_SMS_CODE '1234' в AuthContext | API отправки и проверки SMS-кода |
| ID текущего пользователя | 'user-1' в MessagesContext, ChannelPostFooter | id из профиля/авторизации |
| Медиа (placeholder) | placeholderImage, placeholderVideo, stickerDataUrl | Реальные URL с CDN/API |

После замены этих источников на API и контексты все перечисленные сущности будут динамическими. Описание сущностей и типов — в `ENTITIES_AND_TYPES.md`.

---

## 6. Константа пагинации сообщений (поведение, не данные)

| Имя | Файл | Описание |
|-----|------|----------|
| `MESSAGES_PAGE_SIZE` | `src/constants.ts` | Размер страницы сообщений (по умолчанию 50). Задаёт, сколько последних сообщений показывать при открытии чата и на сколько увеличивать подгрузку при скролле вверх. Сейчас используется только на клиенте; после подключения API ту же константу можно передавать в запросы (`limit` / пагинация). |

Эта переменная статична в коде, но определяет именно **поведение** отображения и подгрузки, а не сами данные. При переходе на API значение можно оставить или вынести в конфиг/ env.
