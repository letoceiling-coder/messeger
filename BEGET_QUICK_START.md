# БЫСТРЫЙ СТАРТ: DEPLOYMENT НА BEGET

## 🚀 БЫСТРАЯ УСТАНОВКА

### 1. Подключение к серверу

```bash
ssh user@your-server.beget.com
```

### 2. Клонирование проекта

```bash
cd ~
git clone <repository-url> messager
cd messager
```

### 3. Настройка Backend

```bash
cd backend

# Установка зависимостей
npm install --production

# Создание .env.production
cp .env.production.example .env.production
nano .env.production
# Заполнить все значения

# Миграция БД
npx prisma generate
npx prisma migrate deploy

# Сборка
npm run build

# Создание директорий
mkdir -p uploads/audio logs

# Установка PM2
npm install -g pm2

# Запуск
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Настройка Frontend

```bash
cd ../frontend-web

# Установка зависимостей
npm install

# Создание .env.production
cp .env.production.example .env.production
nano .env.production
# Заполнить значения

# Сборка
npm run build

# Размещение файлов
cp -r dist/* ~/public_html/
```

### 5. Настройка Nginx

```bash
# Копировать конфигурации
sudo cp nginx/messager-api.conf /etc/nginx/sites-available/
sudo cp nginx/messager-frontend.conf /etc/nginx/sites-available/

# Отредактировать (заменить yourdomain.com на ваш домен)
sudo nano /etc/nginx/sites-available/messager-api.conf
sudo nano /etc/nginx/sites-available/messager-frontend.conf

# Активировать
sudo ln -s /etc/nginx/sites-available/messager-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/messager-frontend /etc/nginx/sites-enabled/

# Проверить и перезагрузить
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL сертификаты

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

---

## ✅ ПРОВЕРКА

```bash
# Backend
curl http://localhost:3000/health

# Frontend
curl https://yourdomain.com

# PM2
pm2 status
pm2 logs
```

---

## 📋 ВАЖНЫЕ ФАЙЛЫ

- `DEPLOYMENT_BEGET.md` - полная инструкция
- `DEPLOYMENT_STEPS.md` - пошаговое руководство
- `BEGET_DEPLOYMENT_CHECKLIST.md` - чеклист
- `PRODUCTION_CONFIG.md` - конфигурация для production

---

## 🔧 ОБНОВЛЕНИЕ

```bash
cd ~/messager
git pull
cd backend
./scripts/deploy.sh
```

---

## 📞 ПОДДЕРЖКА

При проблемах см. `DEPLOYMENT_BEGET.md` раздел "Решение проблем".
