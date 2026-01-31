# Messager Frontend Web

Frontend приложение для мессенджера на React + Vite + TypeScript.

## Установка

```bash
npm install
```

## Настройка

Создайте файл `.env` в корне проекта:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

## Запуск

```bash
# Development
npm run dev

# Build
npm run build

# Preview
npm run preview
```

Приложение будет доступно на `http://localhost:5173`

## Структура

```
src/
├── components/     # React компоненты
├── contexts/       # React Context (Auth, WebSocket)
├── pages/          # Страницы приложения
├── services/       # API и WebSocket сервисы
├── types/          # TypeScript типы
├── App.tsx         # Главный компонент
└── main.tsx        # Точка входа
```

## Функционал

- ✅ Экран логина
- ✅ Список чатов
- ✅ Экран чата
- ✅ WebSocket подключение
- ✅ Отправка и получение сообщений в реальном времени
- ✅ Минимальный, чистый UI с TailwindCSS
