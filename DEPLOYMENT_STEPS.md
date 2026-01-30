# ПОШАГОВОЕ РАЗВЕРТЫВАНИЕ НА BEGET

## ЭТАП 1: ПОДГОТОВКА ЛОКАЛЬНО

### 1.1 Обновить конфигурации

1. Скопировать примеры .env файлов:
   ```bash
   cd backend
   cp .env.production.example .env.production
   
   cd ../frontend-web
   cp .env.production.example .env.production
   ```

2. Заполнить реальные значения (пока заглушки, обновим на сервере)

### 1.2 Проверить зависимости

```bash
# Backend
cd backend
npm install --production

# Frontend
cd ../frontend-web
npm install
```

### 1.3 Собрать проекты

```bash
# Backend
cd backend
npm run build

# Frontend
cd ../frontend-web
npm run build
```

---

## ЭТАП 2: ПОДКЛЮЧЕНИЕ К СЕРВЕРУ

### 2.1 SSH подключение

```bash
ssh user@your-server.beget.com
```

### 2.2 Создать директорию проекта

```bash
mkdir -p ~/messager
cd ~/messager
```

---

## ЭТАП 3: ЗАГРУЗКА ПРОЕКТА

### Вариант 1: Git

```bash
git clone <your-repository-url> .
```

### Вариант 2: SCP

```bash
# С локальной машины
scp -r backend user@server.beget.com:~/messager/
scp -r frontend-web user@server.beget.com:~/messager/
```

### Вариант 3: FTP/SFTP

Использовать FileZilla или аналогичный клиент.

---

## ЭТАП 4: НАСТРОЙКА БАЗЫ ДАННЫХ

### 4.1 Создать БД через панель Beget

1. Войти в панель управления Beget
2. Базы данных → PostgreSQL → Создать
3. Записать данные подключения

### 4.2 Обновить DATABASE_URL

```bash
cd ~/messager/backend
nano .env.production
```

Обновить:
```env
DATABASE_URL="postgresql://u1234567_messager:password@localhost:5432/u1234567_messager?schema=public"
```

### 4.3 Выполнить миграции

```bash
cd ~/messager/backend
npm install --production
npx prisma generate
npx prisma migrate deploy
```

---

## ЭТАП 5: НАСТРОЙКА REDIS

### 5.1 Проверить доступность Redis на Beget

Если Redis доступен через панель:
1. Создать Redis через панель
2. Получить данные подключения
3. Обновить `REDIS_URL` в `.env.production`

### 5.2 Или установить локально

```bash
# Установка Redis
wget http://download.redis.io/redis-stable.tar.gz
tar xvzf redis-stable.tar.gz
cd redis-stable
make
sudo make install

# Настройка
sudo mkdir -p /etc/redis
sudo cp redis.conf /etc/redis/redis.conf

# Запуск
redis-server /etc/redis/redis.conf --daemonize yes
```

### 5.3 Обновить REDIS_URL

```bash
nano ~/messager/backend/.env.production
```

---

## ЭТАП 6: НАСТРОЙКА BACKEND

### 6.1 Установка зависимостей

```bash
cd ~/messager/backend
npm install --production
```

### 6.2 Сборка

```bash
npm run build
```

### 6.3 Настройка переменных окружения

```bash
cp .env.production.example .env.production
nano .env.production
# Заполнить все значения
```

### 6.4 Создать директории

```bash
mkdir -p uploads/audio
mkdir -p logs
```

### 6.5 Запуск через PM2

```bash
# Установка PM2
npm install -g pm2

# Запуск
pm2 start ecosystem.config.js

# Сохранение
pm2 save
pm2 startup
```

---

## ЭТАП 7: НАСТРОЙКА FRONTEND

### 7.1 Сборка

```bash
cd ~/messager/frontend-web
npm install
npm run build
```

### 7.2 Размещение файлов

```bash
# Узнать путь к public_html
echo $HOME/public_html

# Скопировать build
cp -r dist/* ~/public_html/
```

---

## ЭТАП 8: НАСТРОЙКА NGINX

### 8.1 Создать конфигурации

См. `DEPLOYMENT_BEGET.md` для полных конфигураций Nginx.

### 8.2 Активировать

```bash
sudo ln -s /etc/nginx/sites-available/messager-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/messager-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ЭТАП 9: SSL СЕРТИФИКАТЫ

### 9.1 Через Certbot

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

### 9.2 Или через панель Beget

Установить Let's Encrypt через панель управления.

---

## ЭТАП 10: ТЕСТИРОВАНИЕ

### 10.1 Проверка Backend

```bash
curl https://api.yourdomain.com/health
```

### 10.2 Проверка Frontend

Открыть в браузере: `https://yourdomain.com`

### 10.3 Проверка WebSocket

Открыть консоль браузера и проверить подключение.

### 10.4 Проверка E2EE

1. Зарегистрировать пользователей
2. Открыть чат
3. Проверить индикатор E2EE
4. Отправить сообщение

---

## ЭТАП 11: МОНИТОРИНГ

### 11.1 PM2 Monitoring

```bash
pm2 monit
pm2 logs messager-backend
```

### 11.2 Проверка процессов

```bash
ps aux | grep node
netstat -tulpn | grep 3000
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

cd ../frontend-web
npm install
npm run build
cp -r dist/* ~/public_html/
```

---

## РЕЗЕРВНОЕ КОПИРОВАНИЕ

### Автоматический backup

Создать скрипт `~/backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=~/backups
mkdir -p $BACKUP_DIR

# Backup БД
pg_dump -h localhost -U u1234567_messager u1234567_messager > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz ~/messager/backend/uploads

# Удаление старых backup (старше 7 дней)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

Добавить в crontab:

```bash
crontab -e
# Добавить:
0 2 * * * ~/backup.sh
```

---

## ЧЕКЛИСТ ПЕРЕД ЗАПУСКОМ

- [ ] БД создана и миграции выполнены
- [ ] Redis настроен (или отключен)
- [ ] .env.production заполнен
- [ ] Backend собран и запущен
- [ ] Frontend собран и размещен
- [ ] Nginx настроен
- [ ] SSL сертификаты установлены
- [ ] PM2 настроен для автозапуска
- [ ] Backup настроен
- [ ] Тестирование пройдено

---

## ПОДДЕРЖКА

При проблемах проверьте:
1. Логи PM2: `pm2 logs`
2. Логи Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Подключение к БД: `psql -h localhost -U user -d database`
4. Redis: `redis-cli ping`
