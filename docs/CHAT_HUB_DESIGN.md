# Chat Hub Design (Новый дизайн)

Проект нового UI/UX дизайна мессенджера скопирован в `chat-hub-design/` и готов к дальнейшей настройке.

## Расположение

```
Messager/
├── frontend-web/      # Старый веб-фронтенд (оставлен без изменений)
├── chat-hub-design/   # Новый дизайн (chat-hub)
├── backend/
└── mobile/
```

## Запуск нового дизайна

```powershell
cd chat-hub-design
npm install
npm run dev
```

Приложение откроется на http://localhost:8080

## Тестовая авторизация

- Номер телефона: любой (10+ цифр)
- Код: `1234`

## Сущности и типы

Описание сущностей, контекстов и типов данных: `chat-hub-design/docs/ENTITIES_AND_TYPES.md`

## Подключение к бэкенду Messager

1. Запустите бэкенд: `cd backend && npm run start:dev`
2. API-прокси уже настроен в `vite.config.ts` (запросы к `/api` идут на localhost:3000)
3. API-клиент: `src/services/api.ts` — используйте его при замене mock-данных на реальные запросы

## Структура нового дизайна

- **Контексты**: Auth, Chats, Contacts, Messages, Call, Feed, Sticker, AppState
- **Страницы**: Чаты, Контакты, Звонки, Профиль, Лента (Feed), Создание поста/истории
- **Компоненты**: shadcn/ui, layout, call, chat, feed
- **Типы**: `src/types/messenger.ts`, `src/types/feed.ts`
