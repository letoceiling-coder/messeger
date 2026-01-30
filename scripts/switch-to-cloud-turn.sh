#!/bin/bash
# Переключение на облачный TURN (Metered.ca) для теста

set -e

echo "=== Переключение на облачный TURN (Metered.ca) ==="

# Backup текущего .env.production
if [ -f /var/www/messager/frontend-web/.env.production ]; then
  cp /var/www/messager/frontend-web/.env.production /var/www/messager/frontend-web/.env.production.backup
  echo "✓ Бэкап текущего .env.production создан"
fi

# Создать новый .env.production с облачным TURN
cat > /var/www/messager/frontend-web/.env.production <<'EOF'
# Cloud TURN (Metered.ca) - free tier for testing
VITE_TURN_URL=turn:openrelay.metered.ca:443?transport=tcp
VITE_TURN_USER=openrelayproject
VITE_TURN_CREDENTIAL=openrelayproject
EOF

echo "✓ .env.production обновлён на облачный TURN"

# Пересборка фронта
echo "Пересборка фронта..."
cd /var/www/messager/frontend-web
npm run build

echo ""
echo "=== Готово! ==="
echo "Фронт пересобран с облачным TURN (Metered.ca)."
echo ""
echo "Попробуйте звонок с телефона на ПК. Если ICE → connected, проблема в Beget UDP."
echo ""
echo "Для возврата к своему TURN:"
echo "  cp /var/www/messager/frontend-web/.env.production.backup /var/www/messager/frontend-web/.env.production"
echo "  cd /var/www/messager/frontend-web && npm run build"
