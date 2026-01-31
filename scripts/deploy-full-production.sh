#!/bin/bash

# Полный деплой мессенджера на VPS
# Сервер: 89.169.39.244
# Дата: 31 января 2026

set -e

echo "========================================"
echo "🚀 ПОЛНЫЙ ДЕПЛОЙ MESSENGER"
echo "========================================"
echo ""

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Переменные
VPS_IP="89.169.39.244"
VPS_USER="root"
DOMAIN="messenger.ru"  # Замените на ваш домен
PROJECT_DIR="/var/www/messenger"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend-web"
UPLOADS_DIR="$PROJECT_DIR/uploads"
DOWNLOADS_DIR="$PROJECT_DIR/downloads"

echo -e "${GREEN}📦 Шаг 1: Подготовка локальных файлов${NC}"

# Проверить что находимся в корне проекта
if [ ! -d "backend" ] || [ ! -d "frontend-web" ]; then
    echo -e "${RED}❌ Ошибка: запустите скрипт из корня проекта${NC}"
    exit 1
fi

# Создать директорию для деплоя
mkdir -p deploy-temp
cd deploy-temp

echo -e "${GREEN}📦 Копирование backend...${NC}"
cp -r ../backend .
cd backend
rm -rf node_modules .env dist
cd ..

echo -e "${GREEN}📦 Копирование frontend-web...${NC}"
cp -r ../frontend-web .
cd frontend-web
rm -rf node_modules dist .env
cd ..

echo -e "${GREEN}📦 Копирование конфигов...${NC}"
mkdir -p nginx scripts
cp ../nginx/messager-vps.conf nginx/
cp ../scripts/setup-mysql-vps.sh scripts/
cp ../backend/ecosystem.config.js .

cd ..

echo ""
echo -e "${GREEN}✅ Шаг 2: Подключение к VPS${NC}"
echo "Сервер: $VPS_IP"
echo ""

# Проверить доступность сервера
if ! ping -c 1 $VPS_IP &> /dev/null; then
    echo -e "${RED}❌ Сервер недоступен: $VPS_IP${NC}"
    exit 1
fi

echo -e "${GREEN}📤 Шаг 3: Загрузка файлов на сервер${NC}"

# Создать директории на сервере
ssh $VPS_USER@$VPS_IP << 'EOF'
mkdir -p /var/www/messenger/backend
mkdir -p /var/www/messenger/frontend-web
mkdir -p /var/www/messenger/uploads
mkdir -p /var/www/messenger/downloads
mkdir -p /var/www/messenger/logs
EOF

# Загрузить backend
echo "Загрузка backend..."
rsync -avz --progress deploy-temp/backend/ $VPS_USER@$VPS_IP:$BACKEND_DIR/

# Загрузить frontend
echo "Загрузка frontend..."
rsync -avz --progress deploy-temp/frontend-web/ $VPS_USER@$VPS_IP:$FRONTEND_DIR/

# Загрузить конфиги
echo "Загрузка конфигов..."
scp deploy-temp/nginx/messager-vps.conf $VPS_USER@$VPS_IP:/etc/nginx/sites-available/messenger
scp deploy-temp/scripts/setup-mysql-vps.sh $VPS_USER@$VPS_IP:/root/
scp deploy-temp/ecosystem.config.js $VPS_USER@$VPS_IP:$PROJECT_DIR/

echo ""
echo -e "${GREEN}⚙️ Шаг 4: Настройка сервера${NC}"

# Выполнить настройку на сервере
ssh $VPS_USER@$VPS_IP << 'ENDSSH'

echo "🔧 Обновление системы..."
apt update && apt upgrade -y

echo "📦 Установка необходимого ПО..."
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
    systemctl start mysql
    systemctl enable mysql
fi

# PM2
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Certbot (для SSL)
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
fi

echo "📊 Версии установленного ПО:"
echo "Node: $(node -v)"
echo "NPM: $(npm -v)"
echo "Nginx: $(nginx -v 2>&1)"
echo "MySQL: $(mysql --version)"
echo "PM2: $(pm2 -v)"

echo ""
echo "🗄️ Настройка MySQL..."

# Создать базу данных и пользователя
mysql -e "CREATE DATABASE IF NOT EXISTS messenger_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'messenger_user'@'localhost' IDENTIFIED BY 'Messenger2026!';"
mysql -e "GRANT ALL PRIVILEGES ON messenger_prod.* TO 'messenger_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

echo "✅ База данных создана"

echo ""
echo "🔧 Настройка Backend..."

cd /var/www/messenger/backend

# Создать .env.production
cat > .env << 'ENVEOF'
# Database
DATABASE_URL="mysql://messenger_user:Messenger2026!@localhost:3306/messenger_prod"

# JWT
JWT_SECRET="MESSENGER_SUPER_SECRET_KEY_2026_PRODUCTION_XYZ123456789"
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=production

# CORS
CORS_ORIGIN=*

# File Upload
UPLOAD_PATH=../uploads
MAX_FILE_SIZE=52428800

# WebSocket
WS_PATH=/socket.io
ENVEOF

# Установить зависимости
echo "📦 Установка зависимостей backend..."
npm install --production

# Prisma
echo "🔧 Настройка Prisma..."
npx prisma generate
npx prisma db push --accept-data-loss

echo "✅ Backend настроен"

echo ""
echo "🎨 Настройка Frontend..."

cd /var/www/messenger/frontend-web

# Создать .env.production
cat > .env.production << 'ENVEOF'
VITE_API_URL=http://89.169.39.244:3001
VITE_WS_URL=ws://89.169.39.244:3001
ENVEOF

# Установить зависимости и собрать
echo "📦 Установка зависимостей frontend..."
npm install

echo "🏗️ Сборка production build..."
npm run build

echo "✅ Frontend собран"

echo ""
echo "🌐 Настройка Nginx..."

# Активировать конфиг
ln -sf /etc/nginx/sites-available/messenger /etc/nginx/sites-enabled/

# Удалить дефолтный конфиг
rm -f /etc/nginx/sites-enabled/default

# Проверить конфигурацию
nginx -t

# Перезапустить nginx
systemctl restart nginx
systemctl enable nginx

echo "✅ Nginx настроен"

echo ""
echo "🚀 Запуск Backend..."

cd /var/www/messenger

# Остановить если запущен
pm2 delete messenger-api 2>/dev/null || true

# Запустить
pm2 start backend/dist/main.js --name messenger-api --env production

# Сохранить конфигурацию PM2
pm2 save
pm2 startup

echo "✅ Backend запущен"

echo ""
echo "🔒 Настройка Firewall..."

# UFW
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3001/tcp
    ufw --force enable
    echo "✅ Firewall настроен"
fi

echo ""
echo "📊 Статус сервисов:"
systemctl status nginx --no-pager | head -n 5
systemctl status mysql --no-pager | head -n 5
pm2 status

ENDSSH

echo ""
echo -e "${GREEN}✅ Шаг 5: Создание страницы для скачивания APK${NC}"

# Создать страницу для скачивания
ssh $VPS_USER@$VPS_IP << 'DOWNLOAD_EOF'

cat > /var/www/messenger/frontend-web/dist/download.html << 'HTML_EOF'
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Скачать Messenger — Современный мессенджер</title>
    <meta name="description" content="Скачайте Messenger — безопасный мессенджер с E2EE шифрованием, голосовыми звонками и групповыми чатами">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 24px;
            padding: 60px 50px;
            max-width: 600px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 80px rgba(0,0,0,0.3);
            animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .logo {
            width: 120px;
            height: 120px;
            margin: 0 auto 30px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 60px;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }
        
        h1 {
            color: #333;
            font-size: 42px;
            margin-bottom: 15px;
            font-weight: 700;
        }
        
        .subtitle {
            color: #666;
            font-size: 18px;
            margin-bottom: 40px;
            line-height: 1.6;
        }
        
        .download-btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 20px 50px;
            border-radius: 50px;
            text-decoration: none;
            font-size: 20px;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
            margin-bottom: 20px;
        }
        
        .download-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(102, 126, 234, 0.6);
        }
        
        .download-btn:active {
            transform: translateY(-1px);
        }
        
        .platform {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            font-size: 16px;
            color: #999;
            margin-top: 10px;
        }
        
        .features {
            margin-top: 50px;
            padding-top: 40px;
            border-top: 2px solid #f0f0f0;
            text-align: left;
        }
        
        .features h2 {
            color: #333;
            font-size: 24px;
            margin-bottom: 25px;
            text-align: center;
        }
        
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
        }
        
        .feature-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }
        
        .feature-icon {
            font-size: 24px;
            flex-shrink: 0;
        }
        
        .feature-text {
            color: #666;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .feature-text strong {
            color: #333;
            display: block;
            margin-bottom: 3px;
        }
        
        .info-box {
            margin-top: 30px;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 16px;
        }
        
        .info-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .info-item:last-child {
            border-bottom: none;
        }
        
        .info-label {
            color: #666;
            font-size: 15px;
        }
        
        .info-value {
            color: #333;
            font-weight: 600;
            font-size: 15px;
        }
        
        .version {
            margin-top: 30px;
            color: #999;
            font-size: 14px;
        }
        
        .qr-code {
            margin: 30px auto;
            padding: 20px;
            background: white;
            border-radius: 12px;
            display: inline-block;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 40px 30px;
            }
            
            h1 {
                font-size: 32px;
            }
            
            .feature-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">💬</div>
        <h1>Messenger</h1>
        <p class="subtitle">Современный безопасный мессенджер<br>с E2EE шифрованием и групповыми чатами</p>
        
        <a href="messenger-v1.0.0.apk" class="download-btn" download onclick="trackDownload()">
            📥 Скачать для Android
        </a>
        
        <div class="platform">
            <span>📱</span>
            <span>Android 7.0 и выше</span>
        </div>
        
        <div class="info-box">
            <div class="info-item">
                <span class="info-label">📦 Размер</span>
                <span class="info-value">~25 МБ</span>
            </div>
            <div class="info-item">
                <span class="info-label">🆓 Цена</span>
                <span class="info-value">Бесплатно</span>
            </div>
            <div class="info-item">
                <span class="info-label">🔒 Безопасность</span>
                <span class="info-value">E2EE шифрование</span>
            </div>
            <div class="info-item">
                <span class="info-label">📅 Версия</span>
                <span class="info-value">1.0.0</span>
            </div>
        </div>
        
        <div class="features">
            <h2>Возможности</h2>
            <div class="feature-grid">
                <div class="feature-item">
                    <span class="feature-icon">💬</span>
                    <div class="feature-text">
                        <strong>Сообщения</strong>
                        Текст, голос, фото, видео, документы
                    </div>
                </div>
                
                <div class="feature-item">
                    <span class="feature-icon">👥</span>
                    <div class="feature-text">
                        <strong>Группы</strong>
                        Групповые чаты, роли, управление
                    </div>
                </div>
                
                <div class="feature-item">
                    <span class="feature-icon">📞</span>
                    <div class="feature-text">
                        <strong>Звонки</strong>
                        Аудио и видео звонки HD качества
                    </div>
                </div>
                
                <div class="feature-item">
                    <span class="feature-icon">🔐</span>
                    <div class="feature-text">
                        <strong>Шифрование</strong>
                        End-to-End защита переписки
                    </div>
                </div>
                
                <div class="feature-item">
                    <span class="feature-icon">🔔</span>
                    <div class="feature-text">
                        <strong>Уведомления</strong>
                        Push уведомления в реальном времени
                    </div>
                </div>
                
                <div class="feature-item">
                    <span class="feature-icon">🎨</span>
                    <div class="feature-text">
                        <strong>Темы</strong>
                        Светлая, тёмная, системная
                    </div>
                </div>
                
                <div class="feature-item">
                    <span class="feature-icon">⚡</span>
                    <div class="feature-text">
                        <strong>Быстрый</strong>
                        Оптимизированная производительность
                    </div>
                </div>
                
                <div class="feature-item">
                    <span class="feature-icon">🔍</span>
                    <div class="feature-text">
                        <strong>Поиск</strong>
                        По чатам и сообщениям
                    </div>
                </div>
            </div>
        </div>
        
        <div class="version">
            Версия 1.0.0 • 31 января 2026
        </div>
    </div>
    
    <script>
        function trackDownload() {
            // Отслеживание скачиваний (можно добавить аналитику)
            console.log('Download started');
        }
    </script>
</body>
</html>
HTML_EOF

echo "✅ Страница скачивания создана"

DOWNLOAD_EOF

echo ""
echo -e "${GREEN}📱 Шаг 6: Инструкция для загрузки APK${NC}"

# Вывести инструкцию
cat << 'INSTRUCTIONS'

======================================
📱 КАК ЗАГРУЗИТЬ APK НА СЕРВЕР
======================================

Вариант 1: Через SCP (из Windows)
----------------------------------
cd c:\OSPanel\domains\Messager\mobile\android\app\build\outputs\apk\release

scp app-release.apk root@89.169.39.244:/var/www/messenger/downloads/messenger-v1.0.0.apk

Вариант 2: Через FileZilla
---------------------------
1. Собрать APK локально
2. Открыть FileZilla
3. Подключиться к 89.169.39.244
4. Загрузить в /var/www/messenger/downloads/

======================================
✅ ПОСЛЕ ЗАГРУЗКИ APK
======================================

Страница для скачивания:
http://89.169.39.244/download.html

Прямая ссылка на APK:
http://89.169.39.244/messenger-v1.0.0.apk

INSTRUCTIONS

echo ""
echo -e "${GREEN}✅ ДЕПЛОЙ ЗАВЕРШЁН!${NC}"
echo ""
echo "========================================"
echo "📊 ИНФОРМАЦИЯ О ДЕПЛОЕ"
echo "========================================"
echo ""
echo "🌐 Сервер: 89.169.39.244"
echo "🔐 Backend API: http://89.169.39.244:3001"
echo "🌍 Frontend Web: http://89.169.39.244"
echo "📱 Страница скачивания: http://89.169.39.244/download.html"
echo ""
echo "📁 Пути на сервере:"
echo "  - Backend: /var/www/messenger/backend"
echo "  - Frontend: /var/www/messenger/frontend-web/dist"
echo "  - Uploads: /var/www/messenger/uploads"
echo "  - Downloads: /var/www/messenger/downloads"
echo ""
echo "🔧 Команды управления:"
echo "  - Перезапуск backend: pm2 restart messenger-api"
echo "  - Логи backend: pm2 logs messenger-api"
echo "  - Статус: pm2 status"
echo "  - Перезапуск nginx: systemctl restart nginx"
echo ""
echo "📱 Следующие шаги:"
echo "  1. Собрать APK локально (см. BUILD_APK_GUIDE.md)"
echo "  2. Загрузить APK на сервер (команда выше)"
echo "  3. Протестировать: http://89.169.39.244/download.html"
echo ""
echo "========================================"
echo -e "${GREEN}🎉 ВСЁ ГОТОВО К ИСПОЛЬЗОВАНИЮ!${NC}"
echo "========================================"

# Очистка временных файлов
cd ..
rm -rf deploy-temp

exit 0
