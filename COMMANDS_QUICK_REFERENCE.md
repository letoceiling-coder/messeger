# ⚡ БЫСТРАЯ СПРАВКА: Команды

**Все необходимые команды в одном месте**

---

## 🚀 ДЕПЛОЙ НА VPS

### Автоматический деплой (рекомендуется):

```bash
cd /c/OSPanel/domains/Messager
chmod +x scripts/deploy-full-production.sh
./scripts/deploy-full-production.sh
```

**Время:** 15 минут  
**Сервер:** 89.169.39.244

---

## 📱 СБОРКА APK

### 1. Создать keystore (один раз):

```bash
cd mobile/android/app

keytool -genkeypair -v -storetype PKCS12 \
  -keystore messenger-release.keystore \
  -alias messenger-key \
  -keyalg RSA -keysize 2048 -validity 10000
```

Пароль: `Test123456` (сохраните!)

### 2. Настроить gradle.properties:

Файл: `mobile/android/gradle.properties`

```properties
MESSENGER_UPLOAD_STORE_FILE=messenger-release.keystore
MESSENGER_UPLOAD_KEY_ALIAS=messenger-key
MESSENGER_UPLOAD_STORE_PASSWORD=Test123456
MESSENGER_UPLOAD_KEY_PASSWORD=Test123456
```

### 3. Собрать APK:

```bash
cd mobile/android
.\gradlew clean
.\gradlew assembleRelease
```

**APK:** `android\app\build\outputs\apk\release\app-release.apk`

### 4. Загрузить на сервер:

```bash
cd c:\OSPanel\domains\Messager\mobile\android\app\build\outputs\apk\release

scp app-release.apk root@89.169.39.244:/var/www/messenger/downloads/messenger-v1.0.0.apk
```

### 5. Установить права:

```bash
ssh root@89.169.39.244
chmod 644 /var/www/messenger/downloads/messenger-v1.0.0.apk
exit
```

---

## 🌐 ПРОВЕРКА РАБОТЫ

### Веб-версия:
```
http://89.169.39.244
```

### API:
```bash
curl http://89.169.39.244:3001
```

### Страница скачивания APK:
```
http://89.169.39.244/download.html
```

### Прямая ссылка APK:
```
http://89.169.39.244/messenger-v1.0.0.apk
```

---

## 🔧 УПРАВЛЕНИЕ СЕРВЕРОМ

### Подключение к VPS:

```bash
ssh root@89.169.39.244
```

### Backend (PM2):

```bash
# Статус
pm2 status

# Логи (последние 100 строк)
pm2 logs messenger-api --lines 100

# Логи в реальном времени
pm2 logs messenger-api

# Перезапуск
pm2 restart messenger-api

# Остановка
pm2 stop messenger-api

# Удаление
pm2 delete messenger-api

# Список процессов
pm2 list

# Сохранить конфигурацию
pm2 save

# Автозапуск при перезагрузке
pm2 startup
```

### Nginx:

```bash
# Проверка конфигурации
nginx -t

# Перезапуск
systemctl restart nginx

# Статус
systemctl status nginx

# Остановка
systemctl stop nginx

# Запуск
systemctl start nginx

# Логи ошибок
tail -f /var/log/nginx/error.log

# Логи доступа
tail -f /var/log/nginx/access.log
```

### MySQL:

```bash
# Подключение
mysql -u root
mysql -u messenger_user -p

# Статус
systemctl status mysql

# Перезапуск
systemctl restart mysql

# Резервная копия
mysqldump -u root messenger_prod > backup_$(date +%Y%m%d).sql

# Восстановление
mysql -u root messenger_prod < backup.sql

# Список баз данных
mysql -u root -e "SHOW DATABASES;"

# Размер баз данных
mysql -u root -e "SELECT table_schema AS 'Database', 
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' 
  FROM information_schema.TABLES GROUP BY table_schema;"
```

---

## 📊 МОНИТОРИНГ

### Системные ресурсы:

```bash
# CPU и RAM
htop

# Диск
df -h

# Сетевые подключения
netstat -tulpn | grep LISTEN

# Активные процессы
ps aux | grep node
ps aux | grep nginx

# Использование памяти
free -h

# Uptime
uptime
```

### Логи:

```bash
# Backend логи (PM2)
pm2 logs messenger-api --lines 200

# Nginx логи
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Системные логи
tail -f /var/log/syslog

# Последние 50 строк системных ошибок
journalctl -xe | tail -n 50
```

---

## 🔄 ОБНОВЛЕНИЕ

### Backend:

```bash
# Локально (Windows)
cd c:\OSPanel\domains\Messager\backend
scp -r . root@89.169.39.244:/var/www/messenger/backend/

# На сервере
ssh root@89.169.39.244
cd /var/www/messenger/backend
npm install --production
npx prisma generate
npx prisma db push
pm2 restart messenger-api
exit
```

### Frontend:

```bash
# Локально
cd c:\OSPanel\domains\Messager\frontend-web
npm run build
scp -r dist/* root@89.169.39.244:/var/www/messenger/frontend-web/dist/

# Готово! Изменения сразу видны
```

### APK (новая версия):

```bash
# Локально собрать v1.0.1
cd mobile\android
.\gradlew assembleRelease

# Загрузить
scp app-release.apk root@89.169.39.244:/var/www/messenger/downloads/messenger-v1.0.1.apk

# Обновить ссылку в download.html (если нужно)
```

---

## 🐛 TROUBLESHOOTING

### Backend не запускается:

```bash
ssh root@89.169.39.244

# Проверить логи
pm2 logs messenger-api --lines 50

# Проверить процесс
pm2 status

# Убить и перезапустить
pm2 delete messenger-api
cd /var/www/messenger
pm2 start backend/dist/main.js --name messenger-api

# Проверить порт
netstat -tulpn | grep 3001
```

### Frontend не отображается:

```bash
ssh root@89.169.39.244

# Проверить nginx
nginx -t
systemctl status nginx

# Проверить файлы
ls -lh /var/www/messenger/frontend-web/dist/

# Проверить логи
tail -f /var/log/nginx/error.log

# Перезапустить
systemctl restart nginx
```

### MySQL недоступна:

```bash
ssh root@89.169.39.244

# Статус
systemctl status mysql

# Перезапуск
systemctl restart mysql

# Проверка подключения
mysql -u messenger_user -p -e "SELECT 1;"

# Проверка процесса
ps aux | grep mysql
```

### Полный перезапуск всего:

```bash
ssh root@89.169.39.244

pm2 restart all
systemctl restart nginx
systemctl restart mysql

# Проверка
pm2 status
systemctl status nginx
systemctl status mysql

exit
```

---

## 📦 РЕЗЕРВНОЕ КОПИРОВАНИЕ

### Создать бэкап:

```bash
ssh root@89.169.39.244

# База данных
mysqldump -u root messenger_prod > /root/backup_$(date +%Y%m%d_%H%M%S).sql

# Загруженные файлы
tar -czf /root/uploads_$(date +%Y%m%d).tar.gz /var/www/messenger/uploads

# Скачать на локальный компьютер
exit

scp root@89.169.39.244:/root/backup_*.sql ./backups/
scp root@89.169.39.244:/root/uploads_*.tar.gz ./backups/
```

### Восстановить из бэкапа:

```bash
# Загрузить на сервер
scp ./backups/backup_20260131.sql root@89.169.39.244:/root/

# На сервере
ssh root@89.169.39.244
mysql -u root messenger_prod < /root/backup_20260131.sql
```

---

## 🔒 БЕЗОПАСНОСТЬ

### Firewall (UFW):

```bash
# Включить
ufw enable

# Разрешить SSH
ufw allow 22/tcp

# Разрешить HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Разрешить backend API
ufw allow 3001/tcp

# Статус
ufw status

# Отключить порт
ufw delete allow 3001/tcp
```

### SSL сертификат (Let's Encrypt):

```bash
# Установить certbot
apt install certbot python3-certbot-nginx

# Получить сертификат
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Автопродление (добавляется автоматически)
certbot renew --dry-run
```

---

## 📱 ЛОКАЛЬНАЯ РАЗРАБОТКА

### Backend:

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run start:dev

# Порт: 3001
```

### Frontend:

```bash
cd frontend-web
npm install
npm run dev

# Порт: 5173
```

### Mobile:

```bash
cd mobile

# Настроить API в src/config/api.ts
# Для эмулятора: http://10.0.2.2:3001
# Для устройства: http://YOUR_IP:3001

npm install
npm run android  # или npm run ios
```

---

## ✅ БЫСТРЫЕ ПРОВЕРКИ

### Всё ли работает:

```bash
# Backend
curl http://89.169.39.244:3001

# Frontend
curl http://89.169.39.244

# WebSocket (на сервере)
ssh root@89.169.39.244 "netstat -an | grep 3001"

# APK доступен
curl -I http://89.169.39.244/messenger-v1.0.0.apk
```

### Версии ПО:

```bash
ssh root@89.169.39.244

node -v
npm -v
pm2 -v
nginx -v
mysql --version

exit
```

---

## 📞 ПОДДЕРЖКА

**Проблемы с:**
- Деплоем → `DEPLOY_INSTRUCTIONS.md`
- Сборкой APK → `mobile/BUILD_APK_GUIDE.md`
- Публикацией → `PUBLICATION_CHECKLIST.md`
- Использованием → `USER_GUIDE.md`

**Контакты:**
- Email: support@messenger.ru
- Telegram: @messenger_support

---

**Дата:** 31 января 2026  
**Версия:** 1.0.0  
**Сервер:** root@89.169.39.244

**УДАЧНОЙ РАБОТЫ! 💪**
