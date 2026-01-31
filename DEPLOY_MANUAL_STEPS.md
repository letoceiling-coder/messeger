# 🔧 РУЧНОЙ ДЕПЛОЙ (Пошагово)

**Для случаев когда скрипты не работают**

**Сервер:** root@89.169.39.244  
**Пароль:** r4w*F+jVbD2Z

---

## 📋 ШАГ 1: ДЕПЛОЙ BACKEND И FRONTEND

### Откройте Git Bash

```bash
cd /c/OSPanel/domains/Messager
```

### Выполните по одной команде:

```bash
# 1. Создать директории на сервере
ssh root@89.169.39.244 "mkdir -p /var/www/messenger/{backend,frontend-web,uploads,downloads}"

# 2. Загрузить backend
rsync -avz --exclude 'node_modules' --exclude 'dist' backend/ root@89.169.39.244:/var/www/messenger/backend/

# 3. Загрузить frontend
rsync -avz --exclude 'node_modules' --exclude 'dist' frontend-web/ root@89.169.39.244:/var/www/messenger/frontend-web/

# 4. Загрузить nginx конфиг
scp nginx/messager-vps-production.conf root@89.169.39.244:/etc/nginx/sites-available/messenger
```

---

## ⚙️ ШАГ 2: НАСТРОЙКА НА СЕРВЕРЕ

### Подключитесь к серверу:

```bash
ssh root@89.169.39.244
```

### Установите ПО (по одной команде):

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# PM2
npm install -g pm2

# Nginx
apt install -y nginx

# MySQL
apt install -y mysql-server
```

### Настройте MySQL:

```bash
mysql -e "CREATE DATABASE IF NOT EXISTS messenger_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'messenger_user'@'localhost' IDENTIFIED BY 'Messenger2026!';"
mysql -e "GRANT ALL PRIVILEGES ON messenger_prod.* TO 'messenger_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
```

---

## 🔧 ШАГ 3: НАСТРОЙКА BACKEND

```bash
cd /var/www/messenger/backend

# Создать .env
cat > .env << 'EOF'
DATABASE_URL="mysql://messenger_user:Messenger2026!@localhost:3306/messenger_prod"
JWT_SECRET="MESSENGER_SUPER_SECRET_KEY_2026_PRODUCTION"
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
CORS_ORIGIN=*
UPLOAD_PATH=../uploads
MAX_FILE_SIZE=52428800
EOF

# Установить зависимости
npm install --production

# Prisma
npx prisma generate
npx prisma db push
```

---

## 🎨 ШАГ 4: НАСТРОЙКА FRONTEND

```bash
cd /var/www/messenger/frontend-web

# Создать .env.production
cat > .env.production << 'EOF'
VITE_API_URL=http://89.169.39.244:3001
VITE_WS_URL=ws://89.169.39.244:3001
EOF

# Установить и собрать
npm install
npm run build
```

---

## 🌐 ШАГ 5: НАСТРОЙКА NGINX

```bash
# Активировать конфиг
ln -sf /etc/nginx/sites-available/messenger /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверить и перезапустить
nginx -t
systemctl restart nginx
```

---

## 🚀 ШАГ 6: ЗАПУСК BACKEND

```bash
cd /var/www/messenger

# Запустить через PM2
pm2 start backend/dist/main.js --name messenger-api
pm2 save
pm2 startup

# Проверить статус
pm2 status
```

---

## ✅ ШАГ 7: ПРОВЕРКА

### В браузере откройте:

```
http://89.169.39.244
```

Должна открыться страница входа.

### Проверить API:

```bash
curl http://89.169.39.244:3001
```

### Проверить статус:

```bash
pm2 status
systemctl status nginx
```

---

## 📱 БЕЗ APK (ТОЛЬКО ВЕБ)

Если хотите только веб-версию без мобильного приложения:

1. ✅ Выполните шаги 1-7
2. ✅ Готово! Пользователи могут использовать: http://89.169.39.244

**APK можно добавить позже.**

---

## 🔧 УПРАВЛЕНИЕ

### Перезапуск backend:

```bash
pm2 restart messenger-api
```

### Логи backend:

```bash
pm2 logs messenger-api
```

### Перезапуск nginx:

```bash
systemctl restart nginx
```

---

## 🆘 ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ

### Backend не запускается:

```bash
cd /var/www/messenger/backend
npm install --production
npx prisma generate
npx prisma db push
pm2 restart messenger-api
pm2 logs messenger-api
```

### Frontend не отображается:

```bash
cd /var/www/messenger/frontend-web
npm run build
nginx -t
systemctl restart nginx
```

### MySQL ошибка:

```bash
systemctl status mysql
systemctl restart mysql
```

---

**СЛЕДУЙТЕ ШАГАМ ПО ПОРЯДКУ!**

**Время:** ~30 минут  
**Результат:** Работающий мессенджер без APK
