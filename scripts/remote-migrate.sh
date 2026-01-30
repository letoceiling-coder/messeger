#!/bin/bash
set -e
cd /var/www/messager/backend
. ./.env.production 2>/dev/null || true
export $(grep -v '^#' .env.production 2>/dev/null | xargs) 2>/dev/null || true
# If migrate deploy fails (P3005 baseline), add column manually and mark migration applied
if ! npx prisma migrate deploy 2>/dev/null; then
  echo "ALTER TABLE messages ADD COLUMN media_url VARCHAR(191) NULL;" | npx prisma db execute --stdin 2>/dev/null || true
  npx prisma migrate resolve --applied 20260130000000_add_media_url 2>/dev/null || true
fi
npx prisma generate
