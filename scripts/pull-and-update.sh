#!/bin/bash
# Na servere: poluchit kod iz Git, sobirat, perezapustit.
# Zapusk: cd /var/www/messager && bash scripts/pull-and-update.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ROOT="${MESSAGER_ROOT:-/var/www/messager}"
cd "$ROOT" || { echo -e "${RED}Error: dir $ROOT not found${NC}"; exit 1; }

echo -e "${GREEN}=== Git pull + update on server ===${NC}"

echo -e "${YELLOW}[0/5] Git pull...${NC}"
git pull --rebase || git pull

echo -e "${YELLOW}[1/5] npm install (frontend)...${NC}"
cd "$ROOT/frontend-web" && npm install && cd "$ROOT"

echo -e "${YELLOW}[2/5] Frontend build...${NC}"
cd "$ROOT/frontend-web" && npm run build && cd "$ROOT" || { echo -e "${RED}Frontend build failed${NC}"; exit 1; }

echo -e "${YELLOW}[3/5] npm install (backend)...${NC}"
cd "$ROOT/backend" && npm install && cd "$ROOT"

echo -e "${YELLOW}[4/5] Backend build...${NC}"
cd "$ROOT/backend" && npm run build && cd "$ROOT" || { echo -e "${RED}Backend build failed${NC}"; exit 1; }

echo -e "${YELLOW}[5/5] PM2 restart...${NC}"
cd "$ROOT/backend" && pm2 restart messager-backend --update-env || pm2 start ecosystem.config.js --name messager-backend
pm2 save 2>/dev/null || true

if command -v nginx >/dev/null 2>&1; then
  echo -e "${YELLOW}Nginx reload...${NC}"
  (sudo nginx -t 2>/dev/null && (sudo systemctl reload nginx 2>/dev/null || sudo service nginx reload 2>/dev/null)) || true
fi

echo -e "${GREEN}=== Done ===${NC}"
