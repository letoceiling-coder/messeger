#!/bin/bash

# Скрипт для развертывания Frontend на сервере

set -e

SERVER="dsc23ytp@5.101.156.207"
FRONTEND_PATH="~/messager/frontend-web"
PUBLIC_HTML="~/parser-auto.site-access.ru/public_html"

echo "🚀 Развертывание Frontend на сервере..."

# Проверка подключения
echo "📡 Проверка подключения..."
if ! ssh -o ConnectTimeout=5 $SERVER "echo 'OK'" 2>/dev/null; then
    echo "❌ Не удалось подключиться к серверу"
    exit 1
fi

echo "📦 Установка зависимостей..."
ssh $SERVER "cd $FRONTEND_PATH && npm install"

echo "🏗️  Сборка проекта..."
ssh $SERVER "cd $FRONTEND_PATH && npm run build"

echo "📁 Копирование build в public_html..."
ssh $SERVER "cp -r $FRONTEND_PATH/dist/* $PUBLIC_HTML/"

echo "✅ Frontend развернут!"
echo "💡 Откройте: https://parser-auto.siteaccess.ru/"
