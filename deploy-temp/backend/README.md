# Messager Backend

MVP Messenger Backend на NestJS + Prisma + PostgreSQL

## Установка

```bash
npm install
```

## Настройка базы данных

1. Создайте файл `.env` на основе `.env.example`
2. Настройте `DATABASE_URL` для подключения к PostgreSQL
3. Запустите миграции:

```bash
npm run prisma:migrate
```

4. Сгенерируйте Prisma Client:

```bash
npm run prisma:generate
```

## Запуск

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Структура

```
src/
├── auth/          # Модуль аутентификации
├── users/         # Модуль пользователей
├── chats/         # Модуль чатов
├── messages/      # Модуль сообщений
└── prisma/        # Prisma сервис
```
