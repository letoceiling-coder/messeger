#!/bin/bash

# Скрипт для развертывания проекта на VPS
# Используйте WinSCP или FileZilla для копирования файлов

VPS_HOST="89.169.39.244"
VPS_USER="root"
VPS_PATH="/var/www/messager"

echo "=========================================="
echo "Развертывание мессенджера на VPS"
echo "=========================================="
echo ""
echo "ИНСТРУКЦИЯ:"
echo "1. Используйте WinSCP или FileZilla"
echo "2. Подключитесь к: $VPS_USER@$VPS_HOST"
echo "3. Скопируйте папку 'backend' в: $VPS_PATH/"
echo "4. Скопируйте содержимое 'frontend-web/dist' в: $VPS_PATH/frontend-web/"
echo ""
echo "После копирования выполните на сервере:"
echo ""
echo "cd $VPS_PATH/backend"
echo "npm install --production"
echo "npx prisma generate"
echo "npx prisma migrate deploy"
echo "npm run build"
echo "pm2 start ecosystem.config.js"
echo "pm2 save"
echo ""
