#!/bin/bash

# Финальное исправление

echo "========================================"
echo "🔧 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ"
echo "========================================"
echo ""

VPS_IP="89.169.39.244"
VPS_USER="root"

ssh $VPS_USER@$VPS_IP bash << 'ENDSSH'

echo "🔍 Проверка файлов backend..."
cd /var/www/messenger/backend

# Найти где dist
ls -la
echo ""
echo "Содержимое dist:"
ls -la dist/ 2>/dev/null || echo "dist не найден"

echo ""
echo "Поиск main.js:"
find . -name "main.js" -type f

echo ""
echo "🔧 Пересборка backend..."
npm run build

echo ""
echo "После сборки:"
ls -la dist/

echo ""
echo "🚀 Запуск backend..."
cd /var/www/messenger

# Найти правильный путь к main.js
MAIN_JS=$(find backend -name "main.js" -type f | head -1)

if [ -n "$MAIN_JS" ]; then
    echo "Найден: $MAIN_JS"
    pm2 delete all 2>/dev/null || true
    pm2 start $MAIN_JS --name messenger-api
    pm2 save
    echo "✅ Backend запущен"
else
    echo "❌ main.js не найден!"
fi

echo ""
echo "📊 Статус:"
pm2 status

echo ""
echo "🌐 Проверка backend:"
curl -I http://localhost:3001 2>/dev/null | head -5

ENDSSH

echo ""
echo "========================================"
echo "✅ ПРОВЕРКА ЗАВЕРШЕНА"
echo "========================================"
echo ""
echo "Откройте: http://89.169.39.244"
