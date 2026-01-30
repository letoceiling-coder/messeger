#!/bin/bash
# Run on server: loads .env.production and runs prisma migrate deploy
# Usage: bash scripts/run-migrate-on-server.sh (from /var/www/messager)
set -e
ROOT="${MESSAGER_ROOT:-/var/www/messager}"
cd "$ROOT/backend" || exit 1
if [ -f .env.production ]; then set -a; . ./.env.production; set +a
elif [ -f .env ]; then set -a; . ./.env; set +a; fi
npx prisma migrate deploy
