#!/bin/bash
# Отправка тестового SMS. Запуск на сервере или локально.
# Требует: SMSC_LOGIN, SMSC_PASSWORD в .env или export

set -e
cd "$(dirname "$0")/../backend"

# Загрузить .env если есть
[ -f .env ] && set -a && source .env && set +a

PHONE="${1:-89897625658}"
MES="${2:-Messager: тестовое сообщение. Код: 1234}"

if [ -z "$SMSC_LOGIN" ] || [ -z "$SMSC_PASSWORD" ]; then
  echo "Ошибка: SMSC_LOGIN и SMSC_PASSWORD в .env или переменных окружения"
  exit 1
fi

# Нормализация: 89897625658 → 79897625658 (последние 10 цифр + 7)
digits=$(echo "$PHONE" | tr -cd '0-9')
last10="${digits: -10}"
phones="7${last10}"

echo "Отправка на $PHONE (нормализован: $phones)..."
curl -s "https://smsc.ru/sys/send.php?login=$SMSC_LOGIN&psw=$SMSC_PASSWORD&phones=$phones&mes=$(echo "$MES" | jq -sRr @uri)&charset=utf-8&fmt=3" | cat
