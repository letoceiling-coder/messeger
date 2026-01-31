#!/bin/bash

# Скрипт для автоматического развертывания на сервере

set -e

echo "🚀 Начало развертывания..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка переменных окружения
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Файл .env.production не найден!${NC}"
    exit 1
fi

# Установка зависимостей
echo -e "${YELLOW}📦 Установка зависимостей...${NC}"
npm install --production

# Генерация Prisma Client
echo -e "${YELLOW}🔧 Генерация Prisma Client...${NC}"
npx prisma generate

# Выполнение миграций
echo -e "${YELLOW}🗄️  Выполнение миграций БД...${NC}"
npx prisma migrate deploy

# Сборка проекта
echo -e "${YELLOW}🏗️  Сборка проекта...${NC}"
npm run build

# Создание директорий
echo -e "${YELLOW}📁 Создание директорий...${NC}"
mkdir -p uploads/audio
mkdir -p logs

# Перезапуск через PM2
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}🔄 Перезапуск через PM2...${NC}"
    pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js
    pm2 save
else
    echo -e "${YELLOW}⚠️  PM2 не установлен, запуск через systemd...${NC}"
    sudo systemctl restart messager-backend || echo -e "${RED}❌ systemd сервис не настроен${NC}"
fi

echo -e "${GREEN}✅ Развертывание завершено!${NC}"
