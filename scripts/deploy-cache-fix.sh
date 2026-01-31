#!/bin/bash
# Деплой с обновлением системы кеширования

set -e

echo "=== ДЕПЛОЙ С ОБНОВЛЕНИЕМ КЕШИРОВАНИЯ ==="
echo ""

cd /var/www/messager

echo "1. Получение изменений из GitHub..."
git pull origin main

echo ""
echo "2. Копирование обновлённого nginx конфига..."
cp nginx/messager-vps.conf /etc/nginx/sites-available/messager
ln -sf /etc/nginx/sites-available/messager /etc/nginx/sites-enabled/messager

echo ""
echo "3. Проверка конфигурации nginx..."
nginx -t

echo ""
echo "4. Перезагрузка nginx..."
nginx -s reload

echo ""
echo "5. Пересборка фронтенда..."
cd frontend-web
npm run build

echo ""
echo "=== ПРОВЕРКА РЕЗУЛЬТАТА ==="
echo ""
echo "Новые файлы в dist:"
ls -lh dist/assets/index-*.js | tail -1

echo ""
echo "index.html содержит meta-теги:"
grep -A 3 "Cache-Control" dist/index.html | head -4

echo ""
echo "✅ ДЕПЛОЙ ЗАВЕРШЁН!"
echo ""
echo "Изменения:"
echo "  ✅ Meta-теги запрета кеша добавлены"
echo "  ✅ Nginx конфиг обновлён (etag off, if_modified_since off)"
echo "  ✅ Фронтенд пересобран с новыми хешами"
echo ""
echo "Теперь обновления будут применяться мгновенно без проблем с кешем!"
echo ""
echo "Откройте: https://neekloai.ru"
echo "Проверьте в DevTools → Network что index.html загружается заново"
