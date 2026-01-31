#!/bin/bash

# Упрощённый деплой на VPS
# Без проверки ping, прямое подключение

set -e

echo "========================================"
echo "🚀 ДЕПЛОЙ MESSENGER (упрощённый)"
echo "========================================"
echo ""

VPS_IP="89.169.39.244"
VPS_USER="root"

echo "📤 Загрузка файлов на сервер $VPS_IP..."
echo ""

# Создать директории на сервере
echo "Создание директорий..."
ssh $VPS_USER@$VPS_IP "mkdir -p /var/www/messenger/{backend,frontend-web,uploads,downloads,logs}"

# Загрузить backend
echo "Загрузка backend..."
rsync -avz --progress --exclude 'node_modules' --exclude '.env' --exclude 'dist' \
  backend/ $VPS_USER@$VPS_IP:/var/www/messenger/backend/

# Загрузить frontend
echo "Загрузка frontend..."
rsync -avz --progress --exclude 'node_modules' --exclude 'dist' --exclude '.env' \
  frontend-web/ $VPS_USER@$VPS_IP:/var/www/messenger/frontend-web/

# Загрузить nginx конфиг
echo "Загрузка nginx конфига..."
scp nginx/messager-vps-production.conf $VPS_USER@$VPS_IP:/etc/nginx/sites-available/messenger

echo ""
echo "⚙️ Настройка на сервере..."
echo ""

# Выполнить настройку на сервере
ssh $VPS_USER@$VPS_IP bash << 'ENDSSH'

echo "🔧 Установка ПО..."

# Node.js 20
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Nginx
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
fi

# MySQL
if ! command -v mysql &> /dev/null; then
    apt install -y mysql-server
fi

# PM2
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

echo "✅ ПО установлено"
echo ""

echo "🗄️ Настройка MySQL..."
mysql -e "CREATE DATABASE IF NOT EXISTS messenger_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
mysql -e "CREATE USER IF NOT EXISTS 'messenger_user'@'localhost' IDENTIFIED BY 'Messenger2026!';" 2>/dev/null || true
mysql -e "GRANT ALL PRIVILEGES ON messenger_prod.* TO 'messenger_user'@'localhost';" 2>/dev/null || true
mysql -e "FLUSH PRIVILEGES;" 2>/dev/null || true

echo "✅ MySQL настроен"
echo ""

echo "🔧 Настройка Backend..."
cd /var/www/messenger/backend

cat > .env << 'ENVEOF'
DATABASE_URL="mysql://messenger_user:Messenger2026!@localhost:3306/messenger_prod"
JWT_SECRET="MESSENGER_SUPER_SECRET_KEY_2026_PRODUCTION"
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
CORS_ORIGIN=*
UPLOAD_PATH=../uploads
MAX_FILE_SIZE=52428800
ENVEOF

npm install --production
npx prisma generate
npx prisma db push --accept-data-loss

echo "✅ Backend настроен"
echo ""

echo "🎨 Настройка Frontend..."
cd /var/www/messenger/frontend-web

cat > .env.production << 'ENVEOF'
VITE_API_URL=http://89.169.39.244:3001
VITE_WS_URL=ws://89.169.39.244:3001
ENVEOF

npm install
npm run build

echo "✅ Frontend собран"
echo ""

echo "🌐 Настройка Nginx..."
ln -sf /etc/nginx/sites-available/messenger /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo "✅ Nginx настроен"
echo ""

echo "🚀 Запуск Backend..."
cd /var/www/messenger
pm2 delete messenger-api 2>/dev/null || true
pm2 start backend/dist/main.js --name messenger-api --env production
pm2 save
pm2 startup

echo "✅ Backend запущен"
echo ""

echo "📊 Статус:"
pm2 status
systemctl status nginx --no-pager | head -5

ENDSSH

echo ""
echo "========================================"
echo "✅ ДЕПЛОЙ ЗАВЕРШЁН!"
echo "========================================"
echo ""
echo "🌐 Frontend: http://89.169.39.244"
echo "🔐 Backend: http://89.169.39.244:3001"
echo "📱 Страница APK: http://89.169.39.244/download.html"
echo ""
echo "========================================"

exit 0
