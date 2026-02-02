#!/bin/bash
# Применение миграции phone_auth вручную (если prisma migrate deploy даёт P3005)
set -e
cd "$(dirname "$0")/../backend"
. ./.env 2>/dev/null || . ./.env.production 2>/dev/null || true

# Проверяем, нужна ли миграция
if mysql -u messenger_user -p"$MYSQL_PASSWORD" messenger_prod -e "SHOW COLUMNS FROM users LIKE 'phone'" 2>/dev/null | grep -q phone; then
  echo "Column phone exists, skip users alter"
else
  echo "Adding phone column..."
  mysql -u messenger_user -p"$MYSQL_PASSWORD" messenger_prod -e "
    ALTER TABLE users ADD COLUMN phone VARCHAR(191) NULL;
    ALTER TABLE users ADD UNIQUE INDEX users_phone_key(phone);
    ALTER TABLE users MODIFY COLUMN email VARCHAR(191) NULL;
    ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(191) NULL;
  " 2>/dev/null || true
fi

if mysql -u messenger_user -p"$MYSQL_PASSWORD" messenger_prod -e "SHOW TABLES LIKE 'sms_codes'" 2>/dev/null | grep -q sms_codes; then
  echo "Table sms_codes exists"
else
  echo "Creating sms_codes..."
  mysql -u messenger_user -p"$MESSENGER_DB_PASSWORD" messenger_prod < prisma/migrations/20260202000000_phone_auth_sms_codes/migration.sql 2>/dev/null || true
fi

npx prisma generate
npm run build
