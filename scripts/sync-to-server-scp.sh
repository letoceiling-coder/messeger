#!/bin/bash

# Скрипт для синхронизации проекта с сервером через SSH (используя scp)

set -e

SERVER="dsc23ytp@5.101.156.207"
SERVER_PATH="~/messager"
PUBLIC_HTML="~/parser-auto.site-access.ru/public_html"

echo "🚀 Синхронизация проекта с сервером..."

# Проверка подключения
echo "📡 Проверка подключения к серверу..."
if ! ssh -o ConnectTimeout=5 $SERVER "echo 'Подключение успешно'" 2>/dev/null; then
    echo "❌ Не удалось подключиться к серверу"
    exit 1
fi

# Создание структуры на сервере
echo "📁 Создание структуры директорий на сервере..."
ssh $SERVER "mkdir -p $SERVER_PATH/{backend,frontend-web,mobile,nginx}" 2>&1 | grep -v "WARNING" || true

# Синхронизация Backend
echo "📦 Синхронизация Backend..."
scp -r -q backend/src $SERVER:$SERVER_PATH/backend/ 2>&1 | grep -v "WARNING" || true
scp -r -q backend/prisma $SERVER:$SERVER_PATH/backend/ 2>&1 | grep -v "WARNING" || true
scp backend/package.json $SERVER:$SERVER_PATH/backend/ 2>&1 | grep -v "WARNING" || true
scp backend/package-lock.json $SERVER:$SERVER_PATH/backend/ 2>&1 | grep -v "WARNING" || true
scp backend/tsconfig.json $SERVER:$SERVER_PATH/backend/ 2>&1 | grep -v "WARNING" || true
scp backend/nest-cli.json $SERVER:$SERVER_PATH/backend/ 2>&1 | grep -v "WARNING" || true
scp backend/ecosystem.config.js $SERVER:$SERVER_PATH/backend/ 2>&1 | grep -v "WARNING" || true
scp backend/Dockerfile $SERVER:$SERVER_PATH/backend/ 2>&1 | grep -v "WARNING" || true
scp backend/docker-compose.yml $SERVER:$SERVER_PATH/backend/ 2>&1 | grep -v "WARNING" || true

# Синхронизация Frontend
echo "📦 Синхронизация Frontend..."
scp -r -q frontend-web/src $SERVER:$SERVER_PATH/frontend-web/ 2>&1 | grep -v "WARNING" || true
scp -r -q frontend-web/public $SERVER:$SERVER_PATH/frontend-web/ 2>&1 | grep -v "WARNING" || true
scp frontend-web/package.json $SERVER:$SERVER_PATH/frontend-web/ 2>&1 | grep -v "WARNING" || true
scp frontend-web/package-lock.json $SERVER:$SERVER_PATH/frontend-web/ 2>&1 | grep -v "WARNING" || true
scp frontend-web/vite.config.ts $SERVER:$SERVER_PATH/frontend-web/ 2>&1 | grep -v "WARNING" || true
scp frontend-web/tsconfig.json $SERVER:$SERVER_PATH/frontend-web/ 2>&1 | grep -v "WARNING" || true
scp frontend-web/tailwind.config.js $SERVER:$SERVER_PATH/frontend-web/ 2>&1 | grep -v "WARNING" || true
scp frontend-web/postcss.config.js $SERVER:$SERVER_PATH/frontend-web/ 2>&1 | grep -v "WARNING" || true
scp frontend-web/index.html $SERVER:$SERVER_PATH/frontend-web/ 2>&1 | grep -v "WARNING" || true

# Синхронизация Mobile (если существует)
if [ -d "mobile" ]; then
    echo "📦 Синхронизация Mobile..."
    scp -r -q mobile/src $SERVER:$SERVER_PATH/mobile/ 2>&1 | grep -v "WARNING" || true
    scp mobile/package.json $SERVER:$SERVER_PATH/mobile/ 2>&1 | grep -v "WARNING" || true
    scp mobile/app.json $SERVER:$SERVER_PATH/mobile/ 2>&1 | grep -v "WARNING" || true
fi

# Синхронизация конфигураций Nginx
if [ -d "nginx" ]; then
    echo "⚙️  Синхронизация конфигураций Nginx..."
    scp -r -q nginx/* $SERVER:$SERVER_PATH/nginx/ 2>&1 | grep -v "WARNING" || true
fi

echo ""
echo "✅ Синхронизация завершена!"
echo "💡 Для работы на сервере выполните: ssh $SERVER"
