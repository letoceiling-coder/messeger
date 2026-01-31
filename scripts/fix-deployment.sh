#!/bin/bash

# Исправление проблем после деплоя

echo "========================================"
echo "🔧 ИСПРАВЛЕНИЕ ДЕПЛОЯ"
echo "========================================"
echo ""

VPS_IP="89.169.39.244"
VPS_USER="root"

ssh $VPS_USER@$VPS_IP bash << 'ENDSSH'

echo "🔧 Исправление Backend..."
cd /var/www/messenger/backend

# Установить dev зависимости для сборки
npm install

# Собрать backend
npm run build

echo "✅ Backend собран"
echo ""

echo "🎨 Исправление Frontend..."
cd /var/www/messenger/frontend-web

# Установить с игнорированием конфликтов
npm install --legacy-peer-deps

# Собрать frontend
npm run build

echo "✅ Frontend собран"
echo ""

echo "🚀 Перезапуск Backend..."
cd /var/www/messenger

# Остановить старый процесс
pm2 stop messager-backend 2>/dev/null || true
pm2 delete messager-backend 2>/dev/null || true

# Запустить новый
pm2 start backend/dist/main.js --name messenger-api
pm2 save

echo "✅ Backend перезапущен"
echo ""

echo "📊 Статус:"
pm2 status

echo ""
echo "🌐 Проверьте:"
echo "Frontend: http://89.169.39.244"
echo "Backend: http://89.169.39.244:3001"

ENDSSH

echo ""
echo "========================================"
echo "✅ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ!"
echo "========================================"
