#!/bin/bash

# Скрипт для создания пользователя через Backend API

cd ~/messager/backend

# Загрузить переменные окружения
export JWT_SECRET='iIPvW1ifTAzaH7FOu2Q19o4sFSHlcLMekdOIFzmkanE='
export DATABASE_URL='mysql://dsc23ytp_mess:r7nCbBSN%cr3@localhost:3306/dsc23ytp_mess'
export NODE_ENV=production
export PORT=30000
export CORS_ORIGIN='https://parser-auto.siteaccess.ru'

# Запустить Backend в фоне
nohup node dist/main.js > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend запущен, PID: $BACKEND_PID"

# Подождать запуска
sleep 5

# Создать пользователя
curl -X POST http://localhost:30000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "username": "admin",
    "password": "admin123"
  }'

echo ""
echo "Пользователь создан!"
echo "Email: admin@example.com"
echo "Password: admin123"
