# Отчёт о реализации Messenger Chat Hub

**Дата:** 2 февраля 2026  
**Проект:** Messager / chat-hub-design

---

## Реализовано

### Поиск
- ✅ **Поиск в чате** — кнопка в хедере чата, Sheet с вводом и результатами, debounce, скролл к сообщению, подсветка
- ✅ **Глобальный поиск** — API `GET /messages/search/global`, блок «Сообщения» в списке чатов, переход к сообщению

### Сообщения
- ✅ **Черновики** — `useChatDraft`, сохранение в localStorage при смене чата
- ✅ **Редактирование** — контекстное меню «Изменить», API PATCH, WebSocket `message:edited`
- ✅ **Реакции** — MessageReactionsBar, API POST `/messages/:id/reactions`, WebSocket `reaction:updated`
- ✅ **Закреплённые** — PinBanner, контекстное меню, API pin/unpin
- ✅ **Индикатор «печатает...»** — WebSocket `typing:start/stop`, отображение в хедере и списке чатов

### Действия с сообщениями
- ✅ **Контекстное меню** — Ответить, Копировать, Переслать, Закрепить, Изменить, Удалить
- ✅ **Прикрепление документов** — опция «Файл», sendDocumentMessage, типы PDF, DOC, ZIP
- ✅ **Опросы** — CreatePollSheet, PollBubble, отправка через API (content JSON)
- ✅ **Геолокация** — кнопка в AttachSheet, `navigator.geolocation`, отправка координат, ссылка на карту

### Чаты
- ✅ **Архивация** — раздел «Архивированные», восстановление, API `PATCH /chats/:id/archive`
- ✅ **Закрепление чата** — API `PATCH /chats/:id/pin-chat`, сортировка по isPinned
- ✅ **Блокировка контактов** — blockContact, UI в ContactListItem

### Групповые чаты
- ✅ **Создание группы** — страница `/group/create`, выбор участников из контактов, createGroupChat
- ✅ **Информация о группе** — GroupInfoSection: список участников, роли (admin/member), добавление, удаление, «Покинуть группу»
- ✅ **Меню** — SideMenu с пунктом «Новая группа», кнопка Menu в ChatsPage

### Звонки
- ✅ **WebRTC** — CallContext, WebRTCService, Incoming/Outgoing/Active/Video экраны
- ✅ **Имя контакта при входящем** — resolve через getContactById(callerId)
- ✅ **Завершение звонка** — endCall, declineCall, WebSocket call:end/call:rejected

### Backend
- ✅ **Pin/Archive** — миграция `is_pinned`, `is_archived` в `chat_members`, эндпоинты `PATCH /chats/:id/pin-chat`, `PATCH /chats/:id/archive`
- ✅ **getChats** — возвращает isPinned, isArchived из ChatMember
- ✅ **Реакции** — POST `/messages/:id/reactions`, chatId в `reaction:updated`
- ✅ **Реакции в getMessages** — include reactions в ответ

---

## Осталось / Ограничения

### Опросы
- Голосование за варианты — нет API для записи голоса, отображаются только нули
- Рекомендация: добавить `POST /messages/:id/poll/vote` с `{ optionId }`

### Геолокация
- Реализована отправка координат (JSON в content)
- Отображение — ссылка на OpenStreetMap
- Рекомендация: inline-карта (Leaflet/Mapbox) по желанию

### Групповые чаты
- Редактирование названия группы — updateGroupChat есть, UI не добавлен в GroupInfoSection
- Смена аватара группы — не реализовано
- Назначение админа — API updateMemberRole есть, UI в GroupInfoSection не добавлен

### Прочее
- **Mute чата** — только локально, нет API
- **Темная/светлая тема** — ThemeProvider есть, переключатель в настройках
- **Опция «location»** в AttachSheet — реализована (геолокация)

---

## Структура изменений

### Новые файлы
- `chat-hub-design/src/pages/CreateGroupPage.tsx`
- `chat-hub-design/src/components/chat/GroupInfoSection.tsx`
- `chat-hub-design/src/components/chat/CreatePollSheet.tsx`
- `chat-hub-design/src/components/chat/PollBubble.tsx`
- `chat-hub-design/src/components/chat/MessageReactionsBar.tsx`
- `backend/prisma/migrations/20260202150000_chat_member_pin_archive/migration.sql`

### Ключевые правки
- `ChatsContext` — pinChat, archiveChat → API, fetchChatDetails, addMember, removeMember, updateGroupChat, leaveGroup
- `MessagesContext` — sendPollMessage, sendLocationMessage, updateMessageReaction → API, applyReactionFromWs
- `WebSocketProvider` — typing:start/stop, reaction:updated
- `CallContext` — имя контакта через getContactById
- `ChatPage` — GroupInfoSection, CreatePollSheet, PollBubble, Location bubble, MessageReactionsBar
- `ChatsPage` — SideMenu, глобальный поиск, архив
- `ChatListHeader` — onMenuClick
- `chatMapper` — isPinned, isArchived из API
- `messageMapper` — reactions из API
- `backend/chats` — pinChat, archiveChat, isPinned/isArchived в getChats
- `backend/messages` — chatId в reaction:updated, reactions в getMessages

---

## Миграция БД

```sql
ALTER TABLE `chat_members` ADD COLUMN `is_pinned` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_archived` BOOLEAN NOT NULL DEFAULT false;
```

Выполнить: `npx prisma migrate deploy` (или `prisma migrate dev` в dev).
