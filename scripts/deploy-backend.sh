#!/bin/bash

# Скрипт для развертывания Backend на сервере

set -e

SERVER="dsc23ytp@5.101.156.207"
BACKEND_PATH="~/messager/backend"

echo "🚀 Развертывание Backend на сервере..."

# Проверка подключения
echo "📡 Проверка подключения..."
if ! ssh -o ConnectTimeout=5 $SERVER "echo 'OK'" 2>/dev/null; then
    echo "❌ Не удалось подключиться к серверу"
    exit 1
fi

echo "📦 Установка зависимостей..."
ssh $SERVER "cd $BACKEND_PATH && npm install --production"

echo "🔧 Генерация Prisma Client..."
ssh $SERVER "cd $BACKEND_PATH && npx prisma generate"

echo "📊 Миграция базы данных..."
ssh $SERVER "cd $BACKEND_PATH && npx prisma migrate deploy"

echo "🏗️  Сборка проекта..."
ssh $SERVER "cd $BACKEND_PATH && npm run build"

echo "📁 Создание директорий..."
ssh $SERVER "cd $BACKEND_PATH && mkdir -p uploads/audio logs"

echo "✅ Backend готов к запуску!"
echo "💡 Следующий шаг:"
echo "   ssh $SERVER"
echo "   cd $BACKEND_PATH"
echo "   pm2 start ecosystem.config.js"
