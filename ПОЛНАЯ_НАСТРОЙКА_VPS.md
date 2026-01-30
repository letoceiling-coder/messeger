# 🚀 ПОЛНАЯ НАСТРОЙКА VPS - ПОШАГОВАЯ ИНСТРУКЦИЯ

## ✅ ЧТО УЖЕ СДЕЛАНО

- ✅ VPS создан и запущен
- ✅ Подключение по SSH установлено
- ✅ Система обновлена
- ✅ ПО установлено (Node.js, MySQL, Nginx, PM2)

---

## 📋 СЛЕДУЮЩИЕ ШАГИ

### ШАГ 1: Настроить MySQL

```bash
# Войти в MySQL
mysql -u root

# В MySQL выполните:
CREATE DATABASE messager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'messager_user'@'localhost' IDENTIFIED BY 'r7nCbBSN%cr3';
GRANT ALL PRIVILEGES ON messager.* TO 'messager_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### ШАГ 2: Перенести проект на VPS

**Через SCP (с вашего компьютера):**

```bash
# Backend
scp -r backend/* root@89.169.39.244:/var/www/messager/backend/

# Frontend (собранный)
scp -r frontend-web/dist/* root@89.169.39.244:/var/www/messager/frontend-web/
```

### ШАГ 3: Настроить Backend на VPS

```bash
# Подключитесь к VPS
ssh root@89.169.39.244

# Установить зависимости
cd /var/www/messager/backend
npm install

# Создать .env.production
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

```bash
# Выполнить миграции
npx prisma migrate deploy
npx prisma generate

# Собрать Backend
npm run build
```

### ШАГ 4: Настроить Nginx

```bash
nano /etc/nginx/sites-available/messager
```

Содержимое конфигурации:
```nginx
server {
    listen 80;
    server_name parser-auto.siteaccess.ru;

    # Frontend
    root /var/www/messager/frontend-web;
    index index.html;

    # SPA роутинг
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Загрузка файлов
    location /uploads {
        alias /var/www/messager/backend/uploads;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

```bash
# Активировать конфигурацию
ln -s /etc/nginx/sites-available/messager /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Проверить конфигурацию
nginx -t

# Перезагрузить Nginx
systemctl reload nginx
```

### ШАГ 5: Запустить Backend

```bash
cd /var/www/messager/backend
pm2 start ecosystem.config.js --update-env
pm2 save
pm2 startup
```

### ШАГ 6: Настроить SSL (опционально)

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d parser-auto.siteaccess.ru
```

---

## ✅ ГОТОВО!

После выполнения всех шагов:
1. Backend будет работать на `localhost:3000`
2. Nginx будет проксировать запросы
3. WebSocket будет работать
4. Frontend будет доступен на `https://parser-auto.siteaccess.ru`

---

## 📋 ПРОВЕРКА

```bash
# Проверить Backend
curl http://localhost:3000/health

# Проверить Nginx
systemctl status nginx

# Проверить PM2
pm2 status
```
