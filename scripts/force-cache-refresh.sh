#!/bin/bash
# Force browser cache refresh by adding version parameter

echo "=== ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ ВЕРСИИ ==="
echo ""

cd /var/www/messager/frontend-web/dist

# Создаём timestamp
TIMESTAMP=$(date +%s)
echo "Timestamp: $TIMESTAMP"

# Создаём бэкап
cp index.html index.html.bak

# Обновляем index.html
sed -i "s|index-DgNrL6LH.js|index-DgNrL6LH.js?v=${TIMESTAMP}|g" index.html
sed -i "s|index-rGA2pW_o.css|index-rGA2pW_o.css?v=${TIMESTAMP}|g" index.html

echo ""
echo "✅ Обновлённый index.html:"
cat index.html

echo ""
echo "Перезагружаем nginx..."
nginx -t && nginx -s reload

echo ""
echo "✅ ГОТОВО! Кеш будет обойдён при следующей загрузке страницы!"
echo "Откройте: https://neekloai.ru"
