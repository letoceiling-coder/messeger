#!/bin/bash

# Скрипт для настройки работы напрямую с сервером

set -e

# Конфигурация
SERVER="dsc23ytp@dragon"
SERVER_PATH="~/messager"

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔧 Настройка работы напрямую с сервером...${NC}"

# 1. Создание SSH туннеля для работы с БД (опционально)
echo -e "${YELLOW}📡 Создание SSH туннеля для PostgreSQL...${NC}"
echo "Для подключения к БД используйте:"
echo "  ssh -L 5432:localhost:5432 $SERVER"
echo "  Затем подключитесь к localhost:5432"

# 2. Инструкции для VS Code Remote SSH
echo -e "${YELLOW}💻 Настройка VS Code Remote SSH:${NC}"
echo "1. Установите расширение 'Remote - SSH'"
echo "2. Нажмите F1 → 'Remote-SSH: Connect to Host'"
echo "3. Выберите 'dragon' или введите: $SERVER"
echo "4. Откройте папку: $SERVER_PATH"

# 3. Создание alias для быстрого подключения
echo -e "${YELLOW}⚡ Создание alias...${NC}"
if [ -f ~/.bashrc ]; then
    if ! grep -q "alias messager-ssh" ~/.bashrc; then
        echo "" >> ~/.bashrc
        echo "# Messager SSH aliases" >> ~/.bashrc
        echo "alias messager-ssh='ssh $SERVER'" >> ~/.bashrc
        echo "alias messager-sync='./scripts/sync-to-server.sh'" >> ~/.bashrc
        echo "alias messager-deploy='./scripts/deploy-to-server.sh'" >> ~/.bashrc
        echo -e "${GREEN}✅ Alias добавлены в ~/.bashrc${NC}"
        echo "Выполните: source ~/.bashrc"
    fi
fi

# 4. Проверка подключения
echo -e "${YELLOW}🔍 Проверка подключения...${NC}"
if ssh -o ConnectTimeout=5 $SERVER "echo 'OK'" 2>/dev/null; then
    echo -e "${GREEN}✅ Подключение работает!${NC}"
    echo ""
    echo "Быстрые команды:"
    echo "  messager-ssh          - подключиться к серверу"
    echo "  messager-sync         - синхронизировать файлы"
    echo "  messager-deploy       - развернуть проект"
else
    echo -e "${YELLOW}⚠️  Не удалось подключиться. Проверьте SSH настройки.${NC}"
fi
