# 📦 ПЕРЕНЕСЕНИЕ ПРОЕКТА НА VPS

## 📋 СПОСОБЫ ПЕРЕНЕСЕНИЯ

### Вариант 1: Через Git (РЕКОМЕНДУЕТСЯ)

Если проект в Git репозитории:

```bash
cd /var/www/messager
git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ> .
```

### Вариант 2: Через SCP (из локального компьютера)

Выполните на вашем компьютере:

```bash
# Backend
scp -r backend/* root@89.169.39.244:/var/www/messager/backend/

# Frontend (собранный)
scp -r frontend-web/dist/* root@89.169.39.244:/var/www/messager/frontend-web/
```

### Вариант 3: Через rsync (если доступен)

```bash
rsync -avz --exclude 'node_modules' backend/ root@89.169.39.244:/var/www/messager/backend/
rsync -avz frontend-web/dist/ root@89.169.39.244:/var/www/messager/frontend-web/
```

---

## 📋 ПОСЛЕ ПЕРЕНЕСЕНИЯ

### 1. Установить зависимости Backend

```bash
cd /var/www/messager/backend
npm install
```

### 2. Настроить .env

```bash
cd /var/www/messager/backend
nano .env.production
```

Содержимое `.env.production`:
```
DATABASE_URL=mysql://messager_user:r7nCbBSN%cr3@localhost:3306/messager
JWT_SECRET=iIPvW1ifTAzaH7FOu2Q19o4sFSHlcLMekdOIFzmkanE=
REDIS_URL=redis://localhost:6379
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://parser-auto.siteaccess.ru
TELEGRAM_BOT_TOKEN=8519359237:AAG5sbsq8O0OJS0dGVJDp_2wNGd1gED5eDY
```

### 3. Выполнить миграции

```bash
cd /var/www/messager/backend
npx prisma migrate deploy
npx prisma generate
```

### 4. Собрать Backend

```bash
cd /var/www/messager/backend
npm run build
```

---

## ✅ ГОТОВО!

После переноса проекта сообщите мне, и я помогу:
1. Настроить Nginx
2. Запустить Backend
3. Протестировать WebSocket
