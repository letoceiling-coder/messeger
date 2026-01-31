#!/bin/bash

# Запуск только backend (без frontend)

echo "🚀 Запуск Backend..."

VPS_IP="89.169.39.244"
VPS_USER="root"

ssh $VPS_USER@$VPS_IP bash << 'ENDSSH'

cd /var/www/messenger/backend

echo "📦 Установка зависимостей..."
npm install

echo "🏗️ Сборка..."
npm run build

echo "📂 Проверка dist..."
ls -la dist/

if [ -f "dist/main.js" ]; then
    echo "✅ dist/main.js найден"
    
    cd /var/www/messenger
    
    echo "🛑 Остановка старых процессов..."
    pm2 delete all 2>/dev/null || true
    
    echo "🚀 Запуск нового процесса..."
    pm2 start backend/dist/main.js --name messenger-api
    pm2 save
    
    echo ""
    echo "✅ ГОТОВО!"
    echo ""
    pm2 status
    
    echo ""
    echo "🌐 Проверка API:"
    sleep 2
    curl http://localhost:3001
else
    echo "❌ dist/main.js не создан после сборки!"
    echo ""
    echo "Структура backend:"
    ls -la
    echo ""
    echo "Попытка найти main.js:"
    find . -name "main.js"
fi

ENDSSH

echo ""
echo "Проверьте: http://89.169.39.244:3001"
