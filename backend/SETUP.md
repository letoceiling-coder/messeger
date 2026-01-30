# Команды для настройки Backend

## 1. Установка зависимостей

```bash
cd backend
npm install
```

## 2. Настройка базы данных

### Создайте файл `.env`:

```bash
# В папке backend создайте файл .env со следующим содержимым:
DATABASE_URL="postgresql://user:password@localhost:5432/messager?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
```

### Замените в DATABASE_URL:
- `user` - ваш пользователь PostgreSQL
- `password` - ваш пароль PostgreSQL
- `localhost:5432` - хост и порт БД (если отличается)
- `messager` - название базы данных

## 3. Создание базы данных

```bash
# Создайте базу данных в PostgreSQL (если еще не создана)
# Через psql:
createdb messager

# Или через SQL:
psql -U postgres
CREATE DATABASE messager;
```

## 4. Запуск миграций Prisma

```bash
# Создание миграций и применение к БД
npm run prisma:migrate

# Или по отдельности:
npx prisma migrate dev --name init
```

## 5. Генерация Prisma Client

```bash
npm run prisma:generate
```

## 6. Запуск приложения

```bash
# Development режим (с hot-reload)
npm run start:dev

# Production режим
npm run build
npm run start:prod
```

## Создание тестового пользователя (seed)

Если при входе возвращается **401 Unauthorized**, проверьте:

1. **Логи бэкенда** — в логах будет одна из записей:
   - `[AUTH] User not found` — пользователя с таким email нет в БД;
   - `[AUTH] Password valid: false` — неверный пароль.

2. **Создать пользователя dsc-23@yandex.ru / 123123123** (на сервере в папке backend):

```bash
cd /var/www/messager/backend
npm run db:seed
```

Либо зарегистрируйте аккаунт через страницу http://ваш-домен/register.

## Дополнительные команды

```bash
# Открыть Prisma Studio (GUI для БД)
npm run prisma:studio

# Создать тестового пользователя (seed)
npm run db:seed

# Линтинг
npm run lint

# Тесты
npm run test
```
