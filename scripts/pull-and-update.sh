#!/bin/bash
# Na servere: poluchit kod iz Git, sobirat, perezapustit.
# Zapusk: cd /var/www/messager && bash scripts/pull-and-update.sh
# Optimizaciya: npm ci bystrej; propusk npm install, esli package*.json ne menjalis'.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ROOT="${MESSAGER_ROOT:-/var/www/messager}"
cd "$ROOT" || { echo -e "${RED}Error: dir $ROOT not found${NC}"; exit 1; }

echo -e "${GREEN}=== Git pull + update on server ===${NC}"

BEFORE_REF=$(git rev-parse HEAD 2>/dev/null) || true
echo -e "${YELLOW}[0/7] Git pull...${NC}"
git fetch origin
if git show-ref --verify --quiet refs/remotes/origin/main; then
  git reset --hard origin/main
elif git show-ref --verify --quiet refs/remotes/origin/master; then
  git reset --hard origin/master
else
  git pull --rebase 2>/dev/null || git pull || { echo -e "${RED}Git pull failed. Fix branch/remote on server.${NC}"; exit 1; }
fi

DEPS_FRONT_CHANGED=false
DEPS_BACK_CHANGED=false
DEPS_CHAT_HUB_CHANGED=false
if [ -n "$BEFORE_REF" ]; then
  git diff --name-only "$BEFORE_REF" HEAD -- chat-hub-design/package.json chat-hub-design/package-lock.json 2>/dev/null | grep -q . && DEPS_CHAT_HUB_CHANGED=true
  git diff --name-only "$BEFORE_REF" HEAD -- backend/package.json backend/package-lock.json 2>/dev/null | grep -q . && DEPS_BACK_CHANGED=true
else
  DEPS_CHAT_HUB_CHANGED=true
  DEPS_BACK_CHANGED=true
fi

if [ "$DEPS_CHAT_HUB_CHANGED" = true ] || [ ! -d "$ROOT/chat-hub-design/node_modules" ]; then
  echo -e "${YELLOW}[1/7] npm install (chat-hub-design)...${NC}"
  (cd "$ROOT/chat-hub-design" && npm ci 2>/dev/null) || (cd "$ROOT/chat-hub-design" && npm install)
else
  echo -e "${YELLOW}[1/7] chat-hub-design deps unchanged, skip npm install${NC}"
fi
cd "$ROOT"

echo -e "${YELLOW}[2/7] chat-hub-design build (new UI)...${NC}"
cd "$ROOT/chat-hub-design" && npm run build && cd "$ROOT" || { echo -e "${RED}chat-hub-design build failed${NC}"; exit 1; }

if [ "$DEPS_BACK_CHANGED" = true ]; then
  echo -e "${YELLOW}[3/7] npm install (backend)...${NC}"
  (cd "$ROOT/backend" && npm ci 2>/dev/null) || (cd "$ROOT/backend" && npm install)
else
  echo -e "${YELLOW}[3/7] Backend deps unchanged, skip npm install${NC}"
fi
cd "$ROOT"

echo -e "${YELLOW}[4/7] Prisma migrate (backend)...${NC}"
# Load .env.production or .env so DATABASE_URL is set for prisma migrate
(
  cd "$ROOT/backend"
  if [ -f .env.production ]; then set -a; . ./.env.production; set +a
  elif [ -f .env ]; then set -a; . ./.env; set +a; fi
  if npx prisma migrate deploy; then
    echo -e "${GREEN}Prisma migrate deploy OK${NC}"
  else
    echo -e "${YELLOW}migrate deploy failed, trying db push...${NC}"
    npx prisma db push || true
  fi
  npx prisma generate
)

echo -e "${YELLOW}[5/7] Backend build...${NC}"
cd "$ROOT/backend" && npm run build && cd "$ROOT" || { echo -e "${RED}Backend build failed${NC}"; exit 1; }

echo -e "${YELLOW}[6/6] PM2 restart...${NC}"
cd "$ROOT/backend" && pm2 restart messager-backend --update-env || pm2 start ecosystem.config.js --name messager-backend
pm2 save 2>/dev/null || true

echo -e "${YELLOW}[7/7] Nginx config + reload...${NC}"
if [ -f "$ROOT/nginx/messager-vps.conf" ] && [ -d /etc/nginx/sites-available ]; then
  cp "$ROOT/nginx/messager-vps.conf" /etc/nginx/sites-available/messager 2>/dev/null || true
fi
if command -v nginx >/dev/null 2>&1; then
  (nginx -t 2>/dev/null && (systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null)) || true
fi

echo -e "${GREEN}=== Done ===${NC}"
