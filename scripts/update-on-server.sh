#!/bin/bash
# Obnovlenie na servere. Zapusk: cd /var/www/messager && bash scripts/update-on-server.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ROOT="${MESSAGER_ROOT:-/var/www/messager}"
cd "$ROOT" || { echo -e "${RED}Error: dir $ROOT not found${NC}"; exit 1; }

echo -e "${GREEN}=== Update on server ===${NC}"

echo -e "${YELLOW}[1/4] Frontend build...${NC}"
cd "$ROOT/frontend-web" && npm run build && cd "$ROOT" || { echo -e "${RED}Frontend build failed${NC}"; exit 1; }

echo -e "${YELLOW}[2/4] Backend build...${NC}"
cd "$ROOT/backend" && npm run build && cd "$ROOT" || { echo -e "${RED}Backend build failed${NC}"; exit 1; }

echo -e "${YELLOW}[3/4] PM2 restart...${NC}"
cd "$ROOT/backend" && pm2 restart messager-backend --update-env || pm2 start ecosystem.config.js --name messager-backend
pm2 save 2>/dev/null || true

echo -e "${YELLOW}[4/4] Nginx reload...${NC}"
if command -v nginx >/dev/null 2>&1; then
  (sudo nginx -t 2>/dev/null && (sudo systemctl reload nginx 2>/dev/null || sudo service nginx reload 2>/dev/null)) || echo -e "${YELLOW}Reload nginx manually: sudo systemctl reload nginx${NC}"
else
  echo -e "${YELLOW}Nginx not in PATH - reload manually if needed.${NC}"
fi

echo -e "${GREEN}=== Done ===${NC}"
