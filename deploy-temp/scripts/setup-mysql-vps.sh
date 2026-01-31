#!/bin/bash

# Скрипт настройки MySQL для VPS
# Выполните на VPS: bash setup-mysql-vps.sh

mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS messager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'messager_user'@'localhost' IDENTIFIED BY 'r7nCbBSN%cr3';
GRANT ALL PRIVILEGES ON messager.* TO 'messager_user'@'localhost';
FLUSH PRIVILEGES;
SELECT 'Database and user created successfully!' as status;
EOF

echo ""
echo "Проверка подключения:"
mysql -u messager_user -p'r7nCbBSN%cr3' messager -e "SELECT 'Connection successful!' as status;" 2>&1 | grep -v "Warning"
