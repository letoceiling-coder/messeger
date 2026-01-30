#!/bin/bash

# Скрипт для полного развертывания на сервер

set -e

# Конфигурация
SERVER="dsc23ytp@dragon"
SERVER_PATH="~/messager"
PUBLIC_HTML="~/parser-auto.site-access.ru/public_html"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Полное развертывание на сервер...${NC}"

# 1. Синхронизация файлов
echo -e "${YELLOW}📦 Шаг 1: Синхронизация файлов...${NC}"
./scripts/sync-to-server.sh

# 2. Установка зависимостей Backend
echo -e "${YELLOW}📦 Шаг 2: Установка зависимостей Backend...${NC}"
ssh $SERVER "cd $SERVER_PATH/backend && npm install --production"

# 3. Генерация Prisma Client
echo -e "${YELLOW}🔧 Шаг 3: Генерация Prisma Client...${NC}"
ssh $SERVER "cd $SERVER_PATH/backend && npx prisma generate"

# 4. Миграция БД (если нужно)
read -p "Выполнить миграцию БД? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🗄️  Шаг 4: Выполнение миграции БД...${NC}"
    ssh $SERVER "cd $SERVER_PATH/backend && npx prisma migrate deploy"
fi

# 5. Сборка Backend
echo -e "${YELLOW}🏗️  Шаг 5: Сборка Backend...${NC}"
ssh $SERVER "cd $SERVER_PATH/backend && npm run build"

# 6. Создание директорий
echo -e "${YELLOW}📁 Шаг 6: Создание директорий...${NC}"
ssh $SERVER "cd $SERVER_PATH/backend && mkdir -p uploads/audio logs"

# 7. Установка зависимостей Frontend
echo -e "${YELLOW}📦 Шаг 7: Установка зависимостей Frontend...${NC}"
ssh $SERVER "cd $SERVER_PATH/frontend-web && npm install"

# 8. Сборка Frontend
echo -e "${YELLOW}🏗️  Шаг 8: Сборка Frontend...${NC}"
ssh $SERVER "cd $SERVER_PATH/frontend-web && npm run build"

# 9. Размещение Frontend
echo -e "${YELLOW}📤 Шаг 9: Размещение Frontend...${NC}"
ssh $SERVER "cp -r $SERVER_PATH/frontend-web/dist/* $PUBLIC_HTML/"

# 10. Перезапуск Backend (если PM2 установлен)
if ssh $SERVER "command -v pm2" > /dev/null 2>&1; then
    echo -e "${YELLOW}🔄 Шаг 10: Перезапуск Backend через PM2...${NC}"
    ssh $SERVER "cd $SERVER_PATH/backend && pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js"
    ssh $SERVER "pm2 save"
else
    echo -e "${YELLOW}⚠️  PM2 не установлен, Backend нужно запустить вручную${NC}"
fi

echo -e "${GREEN}✅ Развертывание завершено!${NC}"
echo -e "${YELLOW}💡 Проверьте работу:${NC}"
echo -e "   - Backend: ssh $SERVER 'curl http://localhost:3000/health'"
echo -e "   - Frontend: https://parser-auto.site-access.ru"
