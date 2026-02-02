# Отчёт о готовности к реализации (chat-hub-design + backend)

**Дата:** 2026-02-02  
**Цель:** Проверить, всё ли предусмотрено для стабильных звонков, видеозвонков, отправки/получения сообщений разных типов, видеокружков, голосовых, фото, видео, файлов. Ничего не пропустить.

---

## 1. Шаблоны и UI

### 1.1 Список чатов (ChatsPage, ChatListItem)

| Компонент | Статус | Примечание |
|-----------|--------|------------|
| Личные чаты | ✅ Готов | Аватар, lastMessage, unreadCount, isOnline, typing |
| Групповые чаты | ✅ Готов | Иконка группы, количество участников |
| Боты | ✅ Готов | Бейдж Bot на аватаре |
| Каналы | ✅ Готов | Бейдж Megaphone (иконка канала) |
| Превью сообщений | ✅ Готов | text, voice, video_note, image, file — все типы |
| Свайп-действия | ✅ Готов | Закрепить, мут, архив, удалить |
| Pull-to-refresh | ✅ Готов | |

**Источник данных:** mock (ChatsContext, mockData). API не подключён.

---

### 1.2 Чаты (ChatPage)

| Тип сообщения | UI отображение | Отправка (ввод) | Получение | API/Backend |
|---------------|----------------|-----------------|-----------|-------------|
| text | ✅ | ✅ Textarea + Send | ✅ | Backend: message:send, createMessage |
| voice | ✅ VoiceMessageBubble | ✅ useVoiceRecorder + кнопка Mic | ⚠️ Только mock | Backend: upload-audio есть |
| video_note | ✅ VideoNoteBubble | ✅ useVideoNoteRecorder + кнопка Video | ⚠️ Только mock | ❌ Нет upload-video-note |
| image | ✅ | ✅ AttachSheet → photo → file input | ⚠️ createObjectURL только | Backend: upload-image есть |
| video | ✅ | ✅ Тот же file input (image/*,video/*) | ⚠️ createObjectURL только | Backend: upload-video есть |
| file (документ) | ✅ | ❌ AttachSheet имеет, но handleAttachSelect не обрабатывает | — | Backend: upload-document есть |
| sticker | ✅ StickerBubble | ✅ StickerPanel | ✅ mock | ❌ Нет API стикеров |
| contact | ✅ | ✅ AttachSheet → contact → выбор | ⚠️ mock | ❌ Нет API контактов в сообщении |
| location | — | ❌ В AttachSheet есть, не реализовано | — | ❌ Нет |
| poll | — | ❌ В AttachSheet есть, не реализовано | — | ❌ Нет |
| system | ✅ | — | ✅ | — |
| gif | ✅ В типах | — | — | ❌ Нет |

**Дополнительно в ChatPage:**
- ✅ Ответ (reply), редактирование, пересылка, закрепление, удаление
- ✅ Реакции (ChannelPostFooter), комментарии (PostCommentsPage)
- ✅ Кнопки бота (BotButtons), клавиатура бота (BotKeyboard)
- ✅ PinBanner, MediaViewer (fullscreen)

---

### 1.3 Канал

| Функция | UI | Backend |
|---------|-----|---------|
| Экран подписки | ✅ | ❌ Chat.type только direct/group |
| Посты канала | ✅ | ❌ Нет сущности channel |
| Комментарии к посту | ✅ PostCommentsPage | ❌ Нет |
| Реакции, просмотры | ✅ ChannelPostFooter | ✅ MessageReaction есть |
| Отписка | ✅ | ❌ Нет подписок на канал |

---

### 1.4 Бот

| Функция | UI | Backend |
|---------|-----|---------|
| Inline-кнопки под сообщением | ✅ BotButtons | ❌ Message.buttons не хранится |
| Reply-кнопки (ответ) | ✅ | ❌ |
| URL-кнопки | ✅ | ❌ |
| Кастомная клавиатура | ✅ BotKeyboard | ❌ Chat.keyboard не хранится |
| «Обрабатывается...» (isProcessing) | ✅ | ❌ |

---

### 1.5 Лента (Feed)

| Функция | UI | Backend |
|---------|-----|---------|
| Посты | ✅ FeedPage | ❌ Нет FeedPost, FeedComment |
| Истории (Stories) | ✅ StoriesViewer | ❌ Нет FeedStory |
| Лайки, комментарии | ✅ | ❌ |
| Профиль, подписки | ✅ FeedProfilePage | ❌ |
| Создание поста/истории | ✅ FeedCreatePage, FeedCreateStoryPage | ❌ |
| Уведомления | ✅ FeedNotificationsPage | ❌ |
| Поиск | ✅ FeedSearchPage | ❌ |

**Вывод:** Лента полностью на mock, бэкенда нет.

---

## 2. Звонки (аудио и видео)

### 2.1 Backend (WebSocket)

| Событие | Реализовано | Описание |
|---------|-------------|----------|
| call:initiate | ✅ | Инициация звонка |
| call:answer | ✅ | Ответ на звонок |
| call:reject | ✅ | Отклонение |
| call:ice-candidate | ✅ | ICE-кандидаты WebRTC |
| call:end | ✅ | Завершение |

Backend готов для сигналинга WebRTC.

### 2.2 chat-hub-design (CallContext, CallOverlay)

| Компонент | Статус | Проблема |
|-----------|--------|----------|
| IncomingCallScreen | ✅ UI | — |
| OutgoingCallScreen | ✅ UI | — |
| ActiveCallScreen (аудио) | ✅ UI | — |
| VideoCallScreen | ✅ UI | — |
| CallNetworkOverlay | ✅ UI | — |
| **WebRTC** | ❌ | CallContext — **полностью mock**. Нет getUserMedia, RTCPeerConnection, нет подключения к WebSocket call:initiate/answer |
| **Реальные звонки** | ❌ | Звонок «подключается» через setTimeout 2 сек без реального соединения |

### 2.3 frontend-web (для сравнения)

| Компонент | Статус |
|-----------|--------|
| VideoCall | ✅ WebRTC (webrtc.service) |
| WebSocket call:initiate/answer | ✅ WebSocketContext |
| GlobalIncomingCallOverlay | ✅ |

**Вывод:** chat-hub-design нужно интегрировать WebRTC и WebSocket (как в frontend-web), иначе звонки не будут работать.

---

## 3. Отправка и получение сообщений

### 3.1 chat-hub-design

| Действие | Реализация | Проблема |
|----------|------------|----------|
| Текстовое сообщение | setMessages, addMessageToChat (локальный state) | Нет API, нет WebSocket |
| Голосовое | createObjectURL(blob), addMessageToChat | Нет upload на /messages/upload-audio |
| Видеокружок | createObjectURL(blob), addMessageToChat | Нет upload, нет endpoint video_note |
| Фото | createObjectURL(file), addMessageToChat | Нет upload на /messages/upload-image |
| Видео | createObjectURL(file), addMessageToChat | Нет upload на /messages/upload-video |
| Файл | — | handleAttachSelect не обрабатывает 'file' |
| Стикер | addMessageToChat (локально) | Нет API стикеров |
| Контакт | addMessageToChat (локально) | Нет API |

### 3.2 Backend API

| Endpoint | Назначение | Статус |
|----------|------------|--------|
| POST /messages/upload-audio | Голосовые | ✅ |
| POST /messages/upload-image | Фото | ✅ |
| POST /messages/upload-video | Видео | ✅ |
| POST /messages/upload-document | Документы/файлы | ✅ |
| POST /messages (через WebSocket message:send) | Текст | ✅ |
| — | Видеокружок (video_note) | ❌ Нет |

### 3.3 WebSocket

| Событие | Backend | chat-hub-design |
|---------|---------|-----------------|
| message:received | ✅ | ❌ Нет подписки, нет WebSocket |
| message:delivered | ✅ | ❌ |
| message:read | ✅ | ❌ |
| message:deleted | ✅ | ❌ |
| message:edited | ✅ | ❌ |
| chat:join | ✅ | ❌ |

**Вывод:** chat-hub-design не подключён к WebSocket и REST API. Все данные локальные (mock).

---

## 4. Сводка: что есть и чего не хватает

### ✅ Уже реализовано (Backend)

- Текстовые сообщения (REST + WebSocket)
- Голосовые (upload-audio)
- Фото (upload-image)
- Видео (upload-video)
- Документы/файлы (upload-document)
- Реакции на сообщения
- Доставка/прочтение
- Удаление, пересылка, редактирование
- WebRTC-сигналинг для звонков (call:initiate, answer, ice-candidate)

### ✅ Уже реализовано (chat-hub-design UI)

- Список чатов (личные, группы, боты, каналы)
- Все типы сообщений в рендере (text, voice, video_note, image, video, file, sticker, contact, system)
- Запись голоса (useVoiceRecorder)
- Запись видеокружка (useVideoNoteRecorder)
- Отправка текста, фото, видео, контакта, стикера (локально)
- Звонки (UI, но mock)
- Канал (UI, подписка, посты, комментарии)
- Бот (UI, кнопки, клавиатура)
- Лента (UI, mock)

### ❌ Не реализовано / пропущено

| Область | Что нужно |
|---------|-----------|
| **chat-hub-design → API** | Подключить ChatsContext, MessagesContext, AuthContext к REST + WebSocket |
| **Медиа-загрузка** | Заменить createObjectURL на вызовы mediaService.uploadImage/uploadVideo/uploadAudio (как в frontend-web) |
| **Файлы (документы)** | Реализовать handleAttachSelect('file') → input type=file accept=* → uploadDocument |
| **Видеокружок** | Backend: добавить POST /messages/upload-video-note, messageType: 'video_note' |
| **Звонки** | Заменить CallContext mock на WebRTC + WebSocket (взять логику из frontend-web) |
| **Каналы** | Backend: Chat.type = 'channel', подписки, посты как сообщения с replyTo |
| **Боты** | Backend: Chat.type = 'bot', Message.buttons (JSON), Chat.keyboard (JSON) |
| **Лента** | Backend: таблицы FeedPost, FeedComment, FeedStory, API |
| **Стикеры** | Backend: StickerPack, Sticker, API или использовать существующие |
| **Контакты в сообщении** | Backend: messageType 'contact', поля contactName, contactPhone и т.д. |
| **Папка uploads** | main.ts: добавить 'documents' в список создаваемых папок |

---

## 5. Рекомендации по приоритетам

### Фаза 1: Базовые сообщения и медиа (без нового бэкенда)

1. Подключить chat-hub-design к API (auth, chats, messages)
2. Подключить WebSocket (chat:join, message:received, message:delivered, message:read)
3. Голосовые: после записи вызывать upload-audio, затем добавлять сообщение из ответа
4. Фото/видео: заменить createObjectURL на upload-image/upload-video
5. Файлы: реализовать AttachSheet 'file' → upload-document

### Фаза 2: Видеокружок и звонки

6. Backend: upload-video-note (аналогично upload-video, messageType: 'video_note')
7. chat-hub-design: отправка видеокружка через новый endpoint
8. Интеграция WebRTC в CallContext (перенести webrtc.service, WebSocket call-события из frontend-web)

### Фаза 3: Каналы, боты, лента

9. Расширить Prisma: Chat (type: channel, bot), Message (buttons JSON), подписки
10. Лента: новые таблицы и API

---

## 6. Чек-лист «ничего не пропустить»

- [ ] ChatsContext → API /chats
- [ ] MessagesContext → API /messages + WebSocket message:received
- [ ] AuthContext → API auth (или текущий mock для dev)
- [ ] Голосовые → upload-audio после записи
- [ ] Фото → upload-image
- [ ] Видео → upload-video
- [ ] Видеокружок → upload-video-note (создать endpoint)
- [ ] Файлы → upload-document + handleAttachSelect('file')
- [ ] WebSocket chat:join при открытии чата
- [ ] WebSocket message:delivered, message:read при просмотре
- [ ] CallContext → WebRTC + WebSocket call:initiate/answer/ice/end
- [ ] Backend: папка uploads/documents
- [ ] Каналы и боты (при необходимости)
- [ ] Лента (при необходимости)
