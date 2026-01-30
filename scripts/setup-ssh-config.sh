#!/bin/bash

# Скрипт для автоматической настройки SSH config

set -e

SSH_CONFIG="$HOME/.ssh/config"
HOST_NAME="dragon"
HOST_USER="dsc23ytp"

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔧 Настройка SSH config...${NC}"

# Создание .ssh директории если не существует
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Создание backup
if [ -f "$SSH_CONFIG" ]; then
    cp "$SSH_CONFIG" "$SSH_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}📦 Backup создан: $SSH_CONFIG.backup.*${NC}"
fi

# Проверка существования записи
if grep -q "Host $HOST_NAME" "$SSH_CONFIG" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Запись для $HOST_NAME уже существует${NC}"
    read -p "Перезаписать? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Удаление старой записи
        sed -i.bak "/^Host $HOST_NAME$/,/^$/d" "$SSH_CONFIG"
    else
        echo -e "${YELLOW}Отменено${NC}"
        exit 0
    fi
fi

# Добавление новой записи
cat >> "$SSH_CONFIG" << EOF

# Messager Server
Host $HOST_NAME
    HostName $HOST_NAME
    User $HOST_USER
    IdentityFile ~/.ssh/id_rsa
    ServerAliveInterval 60
    ServerAliveCountMax 3
    ForwardAgent yes
EOF

chmod 600 "$SSH_CONFIG"

echo -e "${GREEN}✅ SSH config настроен!${NC}"
echo -e "${YELLOW}💡 Теперь можно подключаться: ssh $HOST_NAME${NC}"

# Проверка подключения
echo -e "${YELLOW}🔍 Проверка подключения...${NC}"
if ssh -o ConnectTimeout=5 $HOST_NAME "echo 'OK'" 2>/dev/null; then
    echo -e "${GREEN}✅ Подключение работает!${NC}"
else
    echo -e "${YELLOW}⚠️  Не удалось подключиться. Проверьте:${NC}"
    echo "   1. SSH ключи настроены"
    echo "   2. Сервер доступен"
    echo "   3. Пользователь $HOST_USER существует"
fi
