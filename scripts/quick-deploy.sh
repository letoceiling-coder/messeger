#!/bin/bash
# Быстрый деплой через git pull

set -e

SERVER="root@89.169.39.244"
SERVER_PATH="/var/www/messager"

echo "🚀 Быстрый деплой мессенджера..."
echo ""

ssh $SERVER << 'ENDSSH'
cd /var/www/messager

echo "📥 Git pull..."
git pull origin main

echo "🏗️ Сборка frontend..."
cd frontend-web
npm run build

echo "♻️ Перезагрузка nginx..."
sudo systemctl reload nginx

echo "✅ Деплой завершён!"
echo ""
echo "Проверьте: https://neekloai.ru"
ENDSSH

echo ""
echo "🎉 Готово! Обновите страницу с Ctrl+F5"
