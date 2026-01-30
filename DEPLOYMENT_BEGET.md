# РАЗВЕРТЫВАНИЕ НА СЕРВЕРЕ BEGET

## ПОДГОТОВКА К DEPLOYMENT

### 1. Настройка окружения

#### Backend .env для Production

Создайте файл `backend/.env.production`:

```env
# Database (Beget PostgreSQL)
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
# Пример: postgresql://u1234567_messager:password@localhost:5432/u1234567_messager

# JWT
JWT_SECRET="your-strong-secret-key-min-32-chars"
JWT_EXPIRES_IN="7d"

# Redis (Beget Redis или локальный)
REDIS_URL="redis://localhost:6379"
# Или если Beget предоставляет Redis:
# REDIS_URL="redis://user:password@host:port"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"

# Server
PORT=3000
NODE_ENV=production

# CORS (указать домены вашего сайта)
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

#### Frontend Web .env для Production

Создайте файл `frontend-web/.env.production`:

```env
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
```

---

## УСТАНОВКА НА СЕРВЕРЕ BEGET

### Шаг 1: Подключение к серверу

```bash
ssh user@your-server.beget.com
```

### Шаг 2: Установка Node.js

Beget обычно предоставляет Node.js через панель управления. Проверьте версию:

```bash
node --version
npm --version
```

Если Node.js не установлен, установите через панель Beget или используйте nvm:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Шаг 3: Клонирование проекта

```bash
cd ~
git clone <your-repository-url> messager
cd messager
```

---

## НАСТРОЙКА POSTGRESQL

### 1. Создание базы данных через панель Beget

1. Войдите в панель управления Beget
2. Перейдите в "Базы данных" → "PostgreSQL"
3. Создайте новую базу данных
4. Запишите данные подключения:
   - Хост: обычно `localhost`
   - Порт: обычно `5432`
   - Имя БД: `u1234567_messager`
   - Пользователь: `u1234567_messager`
   - Пароль: (сгенерированный)

### 2. Обновление DATABASE_URL

В `backend/.env.production`:

```env
DATABASE_URL="postgresql://u1234567_messager:password@localhost:5432/u1234567_messager?schema=public"
```

### 3. Выполнение миграций

```bash
cd backend
npm install --production
npx prisma generate
npx prisma migrate deploy
```

---

## НАСТРОЙКА REDIS

### Вариант 1: Redis на Beget (если доступен)

1. Создайте Redis через панель Beget
2. Получите данные подключения
3. Обновите `REDIS_URL` в `.env.production`

### Вариант 2: Локальная установка Redis

```bash
# Установка Redis
wget http://download.redis.io/redis-stable.tar.gz
tar xvzf redis-stable.tar.gz
cd redis-stable
make
sudo make install

# Запуск Redis
redis-server --daemonize yes

# Проверка
redis-cli ping
```

### Вариант 3: Отключение Redis (для разработки)

Backend будет работать без Redis с предупреждением в логах.

---

## НАСТРОЙКА BACKEND

### 1. Установка зависимостей

```bash
cd backend
npm install --production
```

### 2. Сборка проекта

```bash
npm run build
```

### 3. Настройка переменных окружения

```bash
cp .env.example .env.production
# Отредактировать .env.production
```

### 4. Запуск через PM2 (рекомендуется)

```bash
# Установка PM2
npm install -g pm2

# Запуск
pm2 start dist/main.js --name messager-backend

# Сохранение конфигурации
pm2 save
pm2 startup
```

### 5. Или через systemd

Создайте файл `/etc/systemd/system/messager-backend.service`:

```ini
[Unit]
Description=Messager Backend
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/home/your-user/messager/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/main.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Запуск:

```bash
sudo systemctl enable messager-backend
sudo systemctl start messager-backend
```

---

## НАСТРОЙКА FRONTEND WEB

### 1. Сборка проекта

```bash
cd frontend-web
npm install
npm run build
```

### 2. Размещение файлов

```bash
# Скопировать build на веб-сервер
cp -r dist/* /home/your-user/public_html/
# или
cp -r dist/* /home/your-user/www/
```

---

## НАСТРОЙКА NGINX

### Конфигурация для Backend API

Создайте файл `/etc/nginx/sites-available/messager-api`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Проксирование на Backend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket поддержка
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Статические файлы (uploads)
    location /uploads/ {
        alias /home/your-user/messager/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Конфигурация для Frontend

Создайте файл `/etc/nginx/sites-available/messager-frontend`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    root /home/your-user/public_html;
    index index.html;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Кэширование статических файлов
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA роутинг
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API проксирование
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Активация конфигураций

```bash
sudo ln -s /etc/nginx/sites-available/messager-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/messager-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL СЕРТИФИКАТЫ

### Через Let's Encrypt (Certbot)

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

### Через панель Beget

1. Войдите в панель управления
2. Перейдите в "SSL сертификаты"
3. Установите Let's Encrypt сертификат

---

## ОПТИМИЗАЦИЯ ДЛЯ PRODUCTION

### Backend

1. **Отключить debug режим:**
   ```typescript
   // main.ts
   const app = await NestFactory.create(AppModule, {
     logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'error', 'warn', 'debug'],
   });
   ```

2. **Настроить CORS:**
   ```typescript
   app.enableCors({
     origin: process.env.CORS_ORIGIN?.split(',') || true,
     credentials: true,
   });
   ```

3. **Логирование:**
   - Настроить Winston или Pino для логирования
   - Сохранять логи в файлы

### Frontend

1. **Оптимизация сборки:**
   - Минификация включена автоматически
   - Code splitting настроен
   - Tree shaking работает

2. **CDN для статических файлов:**
   - Загрузить статические файлы на CDN
   - Обновить пути в build

---

## МИГРАЦИЯ БД НА СЕРВЕРЕ

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

**Важно:** Используйте `migrate deploy` для production, а не `migrate dev`.

---

## ТЕСТИРОВАНИЕ НА СЕРВЕРЕ

### 1. Проверка Backend

```bash
curl https://api.yourdomain.com/health
# или
curl http://localhost:3000/health
```

### 2. Проверка Frontend

Откройте в браузере: `https://yourdomain.com`

### 3. Проверка WebSocket

```javascript
const socket = io('wss://api.yourdomain.com', {
  auth: { token: 'your-token' }
});
```

### 4. Проверка E2EE

1. Зарегистрировать пользователей
2. Открыть чат
3. Проверить индикатор E2EE
4. Отправить сообщение
5. Проверить шифрование/дешифрование

### 5. Проверка Redis

```bash
redis-cli ping
# Должен вернуть: PONG
```

---

## МОНИТОРИНГ

### PM2 Monitoring

```bash
pm2 monit
pm2 logs messager-backend
```

### Systemd Logs

```bash
sudo journalctl -u messager-backend -f
```

---

## БЕЗОПАСНОСТЬ

### 1. Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Защита Redis

```bash
# В redis.conf
requirepass your-strong-password
bind 127.0.0.1
```

### 3. Защита БД

- Использовать сильные пароли
- Ограничить доступ только с localhost
- Регулярно обновлять пароли

---

## РЕЗЕРВНОЕ КОПИРОВАНИЕ

### Автоматический backup БД

Создайте скрипт `/home/your-user/backup-db.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U u1234567_messager u1234567_messager > /home/your-user/backups/db_$DATE.sql
find /home/your-user/backups -name "db_*.sql" -mtime +7 -delete
```

Добавьте в crontab:

```bash
crontab -e
# Добавить:
0 2 * * * /home/your-user/backup-db.sh
```

---

## ОБНОВЛЕНИЕ ПРИЛОЖЕНИЯ

```bash
cd ~/messager
git pull
cd backend
npm install --production
npm run build
pm2 restart messager-backend
# или
sudo systemctl restart messager-backend
```

---

## РЕШЕНИЕ ПРОБЛЕМ

### Backend не запускается

```bash
# Проверить логи
pm2 logs messager-backend
# или
sudo journalctl -u messager-backend

# Проверить порт
netstat -tulpn | grep 3000
```

### Ошибка подключения к БД

```bash
# Проверить подключение
psql -h localhost -U u1234567_messager -d u1234567_messager
```

### Ошибка Redis

```bash
# Проверить Redis
redis-cli ping
# Проверить логи
tail -f /var/log/redis/redis-server.log
```

---

## ПОДДЕРЖКА

При возникновении проблем:
1. Проверить логи
2. Проверить переменные окружения
3. Проверить подключения к БД и Redis
4. Проверить конфигурацию Nginx
