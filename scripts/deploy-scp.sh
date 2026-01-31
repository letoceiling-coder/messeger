#!/bin/bash

# Деплой через SCP (без rsync)
# Работает в Git Bash на Windows

set -e

echo "========================================"
echo "🚀 ДЕПЛОЙ MESSENGER через SCP"
echo "========================================"
echo ""

VPS_IP="89.169.39.244"
VPS_USER="root"
VPS_PASS="r4w*F+jVbD2Z"

echo "📦 Подготовка файлов..."

# Создать временный архив
cd /c/OSPanel/domains/Messager

# Создать архив backend (без node_modules)
echo "Архивирование backend..."
tar -czf /tmp/backend.tar.gz \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.env' \
    backend/

# Создать архив frontend (без node_modules)
echo "Архивирование frontend..."
tar -czf /tmp/frontend.tar.gz \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.env' \
    frontend-web/

echo ""
echo "📤 Загрузка на сервер..."

# Создать директории
ssh $VPS_USER@$VPS_IP "mkdir -p /var/www/messenger/{backend,frontend-web,uploads,downloads}"

# Загрузить архивы
echo "Загрузка backend..."
scp /tmp/backend.tar.gz $VPS_USER@$VPS_IP:/tmp/

echo "Загрузка frontend..."
scp /tmp/frontend.tar.gz $VPS_USER@$VPS_IP:/tmp/

echo "Загрузка nginx конфига..."
scp nginx/messager-vps-production.conf $VPS_USER@$VPS_IP:/etc/nginx/sites-available/messenger

echo ""
echo "⚙️ Распаковка и настройка на сервере..."
echo ""

# Выполнить на сервере
ssh $VPS_USER@$VPS_IP bash << 'ENDSSH'

echo "📦 Распаковка файлов..."
cd /var/www/messenger
tar -xzf /tmp/backend.tar.gz
tar -xzf /tmp/frontend.tar.gz
rm /tmp/backend.tar.gz /tmp/frontend.tar.gz

echo "🔧 Установка ПО..."

# Node.js 20
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# PM2
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Nginx
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
fi

# MySQL
if ! command -v mysql &> /dev/null; then
    apt install -y mysql-server
    systemctl start mysql
fi

echo "🗄️ Настройка MySQL..."
mysql -e "CREATE DATABASE IF NOT EXISTS messenger_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
mysql -e "CREATE USER IF NOT EXISTS 'messenger_user'@'localhost' IDENTIFIED BY 'Messenger2026!';" 2>/dev/null || true
mysql -e "GRANT ALL PRIVILEGES ON messenger_prod.* TO 'messenger_user'@'localhost';" 2>/dev/null || true
mysql -e "FLUSH PRIVILEGES;"

echo "🔧 Настройка Backend..."
cd /var/www/messenger/backend

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

npm install --production
npx prisma generate
npx prisma db push --accept-data-loss

echo "🎨 Настройка Frontend..."
cd /var/www/messenger/frontend-web

cat > .env.production << 'EOF'
VITE_API_URL=http://89.169.39.244:3001
VITE_WS_URL=ws://89.169.39.244:3001
EOF

npm install
npm run build

echo "🌐 Настройка Nginx..."
ln -sf /etc/nginx/sites-available/messenger /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo "🚀 Запуск Backend..."
cd /var/www/messenger
pm2 delete messenger-api 2>/dev/null || true
pm2 start backend/dist/main.js --name messenger-api
pm2 save

echo "✅ Готово!"
pm2 status

ENDSSH

# Очистка
rm -f /tmp/backend.tar.gz /tmp/frontend.tar.gz

echo ""
echo "========================================"
echo "✅ ДЕПЛОЙ ЗАВЕРШЁН!"
echo "========================================"
echo ""
echo "🌐 Frontend: http://89.169.39.244"
echo "🔐 Backend: http://89.169.39.244:3001"
echo ""
echo "========================================"
