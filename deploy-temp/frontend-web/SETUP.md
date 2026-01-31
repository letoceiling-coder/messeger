# Инструкция по настройке Frontend

## 1. Установка зависимостей

```bash
cd frontend-web
npm install
```

## 2. Настройка переменных окружения

Создайте файл `.env` в папке `frontend-web`:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

## 3. Запуск

```bash
npm run dev
```

Приложение будет доступно на `http://localhost:5173`

## 4. Использование

1. Откройте `http://localhost:5173`
2. Войдите с существующими учетными данными (или зарегистрируйтесь через API)
3. Просматривайте список чатов
4. Открывайте чаты и отправляйте сообщения

## Структура проекта

```
frontend-web/
├── src/
│   ├── contexts/          # React Context (Auth, WebSocket)
│   ├── pages/            # Страницы (Login, Chats, Chat)
│   ├── services/         # API и WebSocket сервисы
│   ├── types/            # TypeScript типы
│   ├── App.tsx           # Главный компонент с роутингом
│   └── main.tsx          # Точка входа
├── package.json
├── vite.config.ts        # Конфигурация Vite
├── tailwind.config.js    # Конфигурация TailwindCSS
└── tsconfig.json         # TypeScript конфигурация
```

## Особенности

- ✅ Минимальный, чистый UI с TailwindCSS
- ✅ Автоматическое подключение WebSocket при авторизации
- ✅ Real-time обмен сообщениями
- ✅ Автоматическое подтверждение доставки сообщений
- ✅ Защищенные маршруты (требуется авторизация)
- ✅ Обработка ошибок
