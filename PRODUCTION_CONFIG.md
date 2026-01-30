# КОНФИГУРАЦИЯ ДЛЯ PRODUCTION

## ОБНОВЛЕНИЯ ДЛЯ PRODUCTION

### Backend

#### 1. main.ts

Уже обновлен с:
- Production логированием
- CORS настройками из переменных окружения
- Оптимизированными настройками

#### 2. Переменные окружения

Создайте `.env.production`:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=...
JWT_SECRET=...
REDIS_URL=...
TELEGRAM_BOT_TOKEN=...
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

#### 3. PM2 конфигурация

Файл `ecosystem.config.js` создан с:
- Cluster mode для масштабирования
- Автоматическим перезапуском
- Логированием
- Ограничением памяти

---

## БЕЗОПАСНОСТЬ

### 1. Переменные окружения

- ✅ Все секреты в .env файлах
- ✅ .env файлы в .gitignore
- ✅ Сильные пароли для JWT_SECRET

### 2. CORS

- ✅ Ограничен конкретными доменами
- ✅ Credentials включены только для нужных доменов

### 3. SSL/TLS

- ✅ Обязательный HTTPS для production
- ✅ WSS для WebSocket

### 4. Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## ПРОИЗВОДИТЕЛЬНОСТЬ

### 1. PM2 Cluster Mode

```javascript
instances: 2, // или 'max' для всех CPU
exec_mode: 'cluster',
```

### 2. Nginx

- ✅ Gzip сжатие
- ✅ Кэширование статических файлов
- ✅ Оптимизация таймаутов

### 3. Redis

- ✅ Кэширование данных
- ✅ Pub/Sub для WebSocket

---

## ЛОГИРОВАНИЕ

### PM2 Logs

```bash
pm2 logs messager-backend
pm2 logs --lines 100
```

### Nginx Logs

```bash
sudo tail -f /var/log/nginx/messager-api-error.log
sudo tail -f /var/log/nginx/messager-frontend-error.log
```

---

## МОНИТОРИНГ

### PM2 Monitoring

```bash
pm2 monit
pm2 status
pm2 info messager-backend
```

### System Resources

```bash
# CPU и память
top
htop

# Дисковое пространство
df -h

# Сетевые подключения
netstat -tulpn
```

---

## ОБНОВЛЕНИЕ

### Автоматический скрипт

Используйте `backend/scripts/deploy.sh`:

```bash
cd ~/messager/backend
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Ручное обновление

```bash
cd ~/messager
git pull
cd backend
npm install --production
npm run build
pm2 restart messager-backend
```

---

## РЕЗЕРВНОЕ КОПИРОВАНИЕ

### Автоматический backup

Используйте `backend/scripts/backup.sh`:

```bash
chmod +x scripts/backup.sh
```

Добавить в crontab:

```bash
crontab -e
# Добавить:
0 2 * * * ~/messager/backend/scripts/backup.sh
```

---

## ПРОВЕРКА ПРОИЗВОДИТЕЛЬНОСТИ

### Load Testing

```bash
# Установить Apache Bench
sudo apt-get install apache2-utils

# Тест
ab -n 1000 -c 10 https://api.yourdomain.com/health
```

### Мониторинг

- PM2 monitoring
- Nginx access logs
- System resources

---

## ОПТИМИЗАЦИЯ

### 1. Database

- Индексы созданы в Prisma схеме
- Connection pooling через Prisma

### 2. Redis

- Кэширование пользователей
- Кэширование чатов

### 3. Frontend

- Code splitting
- Lazy loading
- Минификация

---

## ТЕСТИРОВАНИЕ НА PRODUCTION

### Чеклист

- [ ] Backend отвечает на health check
- [ ] Frontend загружается
- [ ] WebSocket подключается
- [ ] E2EE работает
- [ ] Telegram MiniApp работает
- [ ] Redis работает
- [ ] Логи пишутся корректно
- [ ] Backup работает

---

## ПОДДЕРЖКА

При проблемах:
1. Проверить логи PM2
2. Проверить логи Nginx
3. Проверить системные ресурсы
4. Проверить подключения к БД и Redis
