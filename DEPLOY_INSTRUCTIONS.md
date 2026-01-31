# 🚀 ИНСТРУКЦИЯ ПО ДЕПЛОЮ НА VPS

**Сервер:** 89.169.39.244  
**Дата:** 31 января 2026

---

## 📋 СОДЕРЖАНИЕ

1. [Подготовка](#подготовка)
2. [Деплой на VPS](#деплой-на-vps)
3. [Загрузка APK](#загрузка-apk)
4. [Проверка работы](#проверка-работы)
5. [Управление сервером](#управление-сервером)

---

## 1️⃣ ПОДГОТОВКА

### Требования:

- ✅ SSH доступ к серверу: `root@89.169.39.244`
- ✅ Git Bash или WSL (для Windows)
- ✅ Собранный APK файл

### Проверка доступа к серверу:

```bash
ssh root@89.169.39.244
```

Если подключение успешно → переходим к деплою.

---

## 2️⃣ ДЕПЛОЙ НА VPS

### Вариант A: Автоматический деплой (рекомендуется)

**Запустить из Git Bash (Windows) или терминала (Linux/Mac):**

```bash
cd /c/OSPanel/domains/Messager

chmod +x scripts/deploy-full-production.sh

./scripts/deploy-full-production.sh
```

**Скрипт автоматически:**
- ✅ Загрузит код на сервер
- ✅ Установит все зависимости
- ✅ Настроит MySQL базу данных
- ✅ Соберёт frontend
- ✅ Настроит Nginx
- ✅ Запустит backend через PM2
- ✅ Создаст страницу для скачивания APK

**Время выполнения:** 10-15 минут

---

### Вариант B: Ручной деплой

#### Шаг 1: Подключиться к серверу

```bash
ssh root@89.169.39.244
```

#### Шаг 2: Обновить систему

```bash
apt update && apt upgrade -y
```

#### Шаг 3: Установить Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

#### Шаг 4: Установить Nginx

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

#### Шаг 5: Установить MySQL

```bash
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql

# Создать базу данных
mysql -e "CREATE DATABASE messenger_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER 'messenger_user'@'localhost' IDENTIFIED BY 'Messenger2026!';"
mysql -e "GRANT ALL PRIVILEGES ON messenger_prod.* TO 'messenger_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
```

#### Шаг 6: Установить PM2

```bash
npm install -g pm2
```

#### Шаг 7: Создать директории

```bash
mkdir -p /var/www/messenger/{backend,frontend-web,uploads,downloads,logs}
```

#### Шаг 8: Загрузить код (с локального компьютера)

```bash
# Backend
cd c:\OSPanel\domains\Messager
scp -r backend root@89.169.39.244:/var/www/messenger/

# Frontend
scp -r frontend-web root@89.169.39.244:/var/www/messenger/

# Nginx конфиг
scp nginx/messager-vps.conf root@89.169.39.244:/etc/nginx/sites-available/messenger
```

#### Шаг 9: Настроить Backend (на сервере)

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

#### Шаг 10: Настроить Frontend (на сервере)

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

#### Шаг 11: Настроить Nginx

```bash
ln -sf /etc/nginx/sites-available/messenger /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx
```

#### Шаг 12: Запустить Backend

```bash
cd /var/www/messenger
pm2 start backend/dist/main.js --name messenger-api --env production
pm2 save
pm2 startup
```

---

## 3️⃣ ЗАГРУЗКА APK

### Шаг 1: Собрать APK локально

См. `mobile/BUILD_APK_GUIDE.md` или `QUICK_START_PUBLICATION.md`

```bash
cd c:\OSPanel\domains\Messager\mobile\android
.\gradlew assembleRelease
```

APK: `android\app\build\outputs\apk\release\app-release.apk`

### Шаг 2: Загрузить на сервер

**Из Windows (PowerShell/CMD):**

```bash
cd c:\OSPanel\domains\Messager\mobile\android\app\build\outputs\apk\release

scp app-release.apk root@89.169.39.244:/var/www/messenger/downloads/messenger-v1.0.0.apk
```

**Или через FileZilla:**
1. Подключиться к `89.169.39.244`
2. Загрузить в `/var/www/messenger/downloads/`
3. Переименовать в `messenger-v1.0.0.apk`

### Шаг 3: Установить права доступа (на сервере)

```bash
ssh root@89.169.39.244

chmod 644 /var/www/messenger/downloads/messenger-v1.0.0.apk
chown www-data:www-data /var/www/messenger/downloads/messenger-v1.0.0.apk
```

---

## 4️⃣ ПРОВЕРКА РАБОТЫ

### Backend API:

```bash
curl http://89.169.39.244:3001
```

Должен вернуть ответ сервера.

### Frontend Web:

Откройте в браузере:
```
http://89.169.39.244
```

Должна открыться страница входа.

### Страница скачивания APK:

```
http://89.169.39.244/download.html
```

### Прямая ссылка на APK:

```
http://89.169.39.244/messenger-v1.0.0.apk
```

### Полный тест:

1. **Регистрация:**
   - Открыть http://89.169.39.244
   - Зарегистрировать user1@test.com

2. **Создать чат:**
   - Создать новый чат
   - Отправить сообщение

3. **Скачать APK:**
   - Открыть http://89.169.39.244/download.html
   - Скачать APK на телефон
   - Установить

4. **Войти в mobile:**
   - Открыть приложение
   - Войти как user1@test.com
   - Проверить что чат и сообщения видны

---

## 5️⃣ УПРАВЛЕНИЕ СЕРВЕРОМ

### Backend (PM2)

```bash
# Статус
pm2 status

# Логи
pm2 logs messenger-api

# Перезапуск
pm2 restart messenger-api

# Остановка
pm2 stop messenger-api

# Удаление
pm2 delete messenger-api
```

### Nginx

```bash
# Проверка конфигурации
nginx -t

# Перезапуск
systemctl restart nginx

# Логи
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### MySQL

```bash
# Подключение
mysql -u root

# Резервное копирование
mysqldump -u root messenger_prod > backup.sql

# Восстановление
mysql -u root messenger_prod < backup.sql
```

### Системные логи

```bash
# Backend логи
tail -f /var/www/messenger/logs/backend.log

# PM2 логи
pm2 logs messenger-api --lines 100
```

---

## 🔧 ОБНОВЛЕНИЕ ПРИЛОЖЕНИЯ

### Обновить Backend:

```bash
# Локально
cd c:\OSPanel\domains\Messager
scp -r backend root@89.169.39.244:/var/www/messenger/

# На сервере
ssh root@89.169.39.244
cd /var/www/messenger/backend
npm install --production
npx prisma generate
npx prisma db push
pm2 restart messenger-api
```

### Обновить Frontend:

```bash
# Локально
cd c:\OSPanel\domains\Messager
scp -r frontend-web root@89.169.39.244:/var/www/messenger/

# На сервере
ssh root@89.169.39.244
cd /var/www/messenger/frontend-web
npm install
npm run build
```

### Обновить APK:

```bash
# Собрать новую версию
cd mobile\android
.\gradlew assembleRelease

# Загрузить
scp app-release.apk root@89.169.39.244:/var/www/messenger/downloads/messenger-v1.0.1.apk
```

---

## 🐛 TROUBLESHOOTING

### Backend не запускается

```bash
# Проверить логи
pm2 logs messenger-api

# Проверить .env
cat /var/www/messenger/backend/.env

# Проверить БД
mysql -u messenger_user -p messenger_prod
```

### Frontend не отображается

```bash
# Проверить nginx
nginx -t
systemctl status nginx

# Проверить логи
tail -f /var/log/nginx/error.log
```

### APK не скачивается

```bash
# Проверить что файл существует
ls -lh /var/www/messenger/downloads/

# Проверить права
chmod 644 /var/www/messenger/downloads/messenger-v1.0.0.apk
```

### База данных недоступна

```bash
# Проверить статус MySQL
systemctl status mysql

# Перезапустить
systemctl restart mysql

# Проверить подключение
mysql -u messenger_user -p
```

---

## 📊 МОНИТОРИНГ

### Статус сервисов:

```bash
systemctl status nginx
systemctl status mysql
pm2 status
```

### Использование ресурсов:

```bash
# CPU и RAM
htop

# Диск
df -h

# Сетевые подключения
netstat -tulpn | grep LISTEN
```

### Логи в реальном времени:

```bash
# Все логи
tail -f /var/log/syslog

# Nginx
tail -f /var/log/nginx/access.log

# Backend
pm2 logs messenger-api --lines 50
```

---

## ✅ ЧЕКЛИСТ ДЕПЛОЯ

После деплоя проверьте:

- [ ] Backend запущен: `pm2 status`
- [ ] Nginx работает: `systemctl status nginx`
- [ ] MySQL работает: `systemctl status mysql`
- [ ] Frontend доступен: http://89.169.39.244
- [ ] API доступен: http://89.169.39.244:3001
- [ ] Страница скачивания: http://89.169.39.244/download.html
- [ ] APK доступен: http://89.169.39.244/messenger-v1.0.0.apk
- [ ] Регистрация работает
- [ ] Отправка сообщений работает
- [ ] WebSocket подключается
- [ ] Файлы загружаются

---

## 📱 ССЫЛКИ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ

**Веб-версия:**
```
http://89.169.39.244
```

**Скачать Android:**
```
http://89.169.39.244/download.html
```

**Прямая ссылка APK:**
```
http://89.169.39.244/messenger-v1.0.0.apk
```

---

## 🎯 СЛЕДУЮЩИЕ ШАГИ

После успешного деплоя:

1. **SSL сертификат** (HTTPS)
   ```bash
   certbot --nginx -d yourdomain.com
   ```

2. **Домен** (вместо IP)
   - Купить домен
   - Настроить DNS A-запись на 89.169.39.244
   - Обновить nginx конфиг

3. **Firebase** (Push уведомления)
   - См. `mobile/FIREBASE_SETUP.md`

4. **CodePush** (OTA обновления)
   - См. `mobile/CODEPUSH_SETUP.md`

5. **Google Play** (Публикация)
   - См. `PUBLICATION_CHECKLIST.md`

---

**Версия:** 1.0  
**Дата:** 31 января 2026  
**Сервер:** 89.169.39.244

**ДЕПЛОЙ ЗАВЕРШЁН! 🎉**
