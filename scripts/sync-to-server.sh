#!/bin/bash

# Скрипт для синхронизации проекта с сервером через SSH

set -e

# Конфигурация
SERVER="dsc23ytp@5.101.156.207"  # Основной IP адрес сервера
SERVER_PATH="~/messager"
LOCAL_PATH="."

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Синхронизация проекта с сервером...${NC}"

# Проверка подключения
echo -e "${YELLOW}📡 Проверка подключения к серверу...${NC}"
if ! ssh -o ConnectTimeout=5 $SERVER "echo 'Подключение успешно'" 2>/dev/null; then
    echo -e "${RED}❌ Не удалось подключиться к серверу${NC}"
    exit 1
fi

# Создание структуры на сервере
echo -e "${YELLOW}📁 Создание структуры директорий на сервере...${NC}"
ssh $SERVER "mkdir -p $SERVER_PATH/{backend,frontend-web,mobile}"

# Синхронизация Backend
echo -e "${YELLOW}📦 Синхронизация Backend...${NC}"
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude 'uploads' \
  --exclude 'logs' \
  --exclude '.env' \
  --exclude '.env.local' \
  backend/ $SERVER:$SERVER_PATH/backend/

# Синхронизация Frontend
echo -e "${YELLOW}📦 Синхронизация Frontend...${NC}"
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude '.env' \
  --exclude '.env.local' \
  frontend-web/ $SERVER:$SERVER_PATH/frontend-web/

# Синхронизация Mobile (опционально)
if [ -d "mobile" ]; then
    echo -e "${YELLOW}📦 Синхронизация Mobile...${NC}"
    rsync -avz --progress \
      --exclude 'node_modules' \
      --exclude '.git' \
      --exclude '.expo' \
      mobile/ $SERVER:$SERVER_PATH/mobile/
fi

# Синхронизация документации
echo -e "${YELLOW}📚 Синхронизация документации...${NC}"
rsync -avz --progress \
  --exclude '.git' \
  *.md $SERVER:$SERVER_PATH/ 2>/dev/null || true

# Синхронизация конфигураций Nginx
if [ -d "nginx" ]; then
    echo -e "${YELLOW}⚙️  Синхронизация конфигураций Nginx...${NC}"
    rsync -avz --progress \
      nginx/ $SERVER:$SERVER_PATH/nginx/
fi

echo -e "${GREEN}✅ Синхронизация завершена!${NC}"
echo -e "${YELLOW}💡 Для работы на сервере выполните: ssh $SERVER${NC}"
