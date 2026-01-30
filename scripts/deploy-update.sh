#!/bin/bash
# Полное обновление: синхронизация кода на сервер + обязательный порядок обновления на сервере.
# Запускать локально из корня проекта: bash scripts/deploy-update.sh

set -e

# Настройки сервера (можно задать через переменные окружения)
SERVER="${DEPLOY_SERVER:-root@89.169.39.244}"
SERVER_PATH="${DEPLOY_PATH:-/var/www/messager}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Деплой: синхронизация и обновление на сервере ===${NC}"

# 1. Синхронизация файлов на сервер (без node_modules, .git, dist)
echo -e "${YELLOW}[1/2] Синхронизация кода на сервер...${NC}"
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'frontend-web/dist' \
  --exclude 'backend/dist' \
  --exclude 'backend/uploads' \
  --exclude 'backend/logs' \
  --exclude 'backend/.env' \
  --exclude 'backend/.env.production' \
  --exclude 'backend/.env.local' \
  ./backend/ "$SERVER:$SERVER_PATH/backend/"
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  ./frontend-web/ "$SERVER:$SERVER_PATH/frontend-web/"
rsync -avz ./nginx/ "$SERVER:$SERVER_PATH/nginx/" 2>/dev/null || true
rsync -avz ./scripts/ "$SERVER:$SERVER_PATH/scripts/" 2>/dev/null || true

# 2. На сервере: обязательный порядок обновления
echo -e "${YELLOW}[2/2] Запуск обновления на сервере (сборка + PM2 + Nginx)...${NC}"
ssh "$SERVER" "cd $SERVER_PATH && bash scripts/update-on-server.sh"

echo -e "${GREEN}=== Готово ===${NC}"
