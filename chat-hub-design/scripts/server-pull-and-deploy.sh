#!/bin/bash
# Скрипт для выполнения на сервере (post-ads.ru): обновление из git и пересборка.
# Разместите в корне проекта на сервере и вызывайте вручную или через webhook (deploy.php).
#
# Использование на сервере:
#   cd ~/stroy/public_html   # или путь к проекту
#   bash scripts/server-pull-and-deploy.sh

cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"

# Убирает ошибку "dubious ownership" при запуске от пользователя веб-сервера (www-data).
# Сначала локальный конфиг (.git/config); если не сработает — один раз на сервере выполнить:
#   sudo git config --system --add safe.directory /home/d/dsc23ytp/stroy/public_html
git config --add safe.directory "$REPO_ROOT" 2>/dev/null || true
git config --global --add safe.directory "$REPO_ROOT" 2>/dev/null || true

echo "=== Git pull ==="
if ! git pull origin main; then
  echo "DEPLOY_FAIL: git pull failed"
  exit 1
fi

echo "=== npm install ==="
if ! npm install; then
  echo "DEPLOY_FAIL: npm install failed"
  exit 1
fi

echo "=== Сборка и копирование в корень ==="
if ! npm run deploy:local; then
  echo "DEPLOY_FAIL: deploy:local failed"
  exit 1
fi

echo "=== Готово ==="
echo "DEPLOY_OK"
exit 0
