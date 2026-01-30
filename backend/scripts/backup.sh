#!/bin/bash

# Скрипт для резервного копирования БД и файлов

set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=~/backups
PROJECT_DIR=~/messager/backend

# Создание директории для backup
mkdir -p $BACKUP_DIR

# Загрузка переменных окружения
source $PROJECT_DIR/.env.production

# Извлечение данных из DATABASE_URL
DB_URL=$DATABASE_URL

# Backup БД
echo "📦 Создание backup БД..."
pg_dump "$DB_URL" > $BACKUP_DIR/db_$DATE.sql
gzip $BACKUP_DIR/db_$DATE.sql

# Backup uploads
echo "📦 Создание backup файлов..."
if [ -d "$PROJECT_DIR/uploads" ]; then
    tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $PROJECT_DIR uploads
fi

# Удаление старых backup (старше 7 дней)
echo "🧹 Очистка старых backup..."
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete

echo "✅ Backup завершен: $BACKUP_DIR"
