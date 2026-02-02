#!/bin/bash
# Проверка флага .deploy-requested и запуск обновления.
# Запускайте из cron каждую минуту под пользователем владельца репозитория (dsc23ytp):
#   * * * * * cd /home/d/dsc23ytp/stroy/public_html && bash scripts/cron-deploy-check.sh >> /tmp/deploy.log 2>&1
#
# Webhook (deploy.php) создаёт файл .deploy-requested; этот скрипт выполняет обновление и удаляет флаг.

cd "$(dirname "$0")/.."

if [ ! -f .deploy-requested ]; then
  exit 0
fi

rm -f .deploy-requested
bash scripts/server-pull-and-deploy.sh
