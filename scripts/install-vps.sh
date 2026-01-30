#!/bin/bash

# Полный скрипт установки для VPS
# Выполните этот скрипт в веб-терминале панели Beget

set -e

echo "=========================================="
echo "Установка ПО для мессенджера на VPS"
echo "=========================================="
echo ""

# Обновление системы
echo "📦 Обновление системы..."
apt-get update
apt-get upgrade -y

# Установка Node.js 20.x
echo ""
echo "📦 Установка Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Проверка версии Node.js
echo ""
echo "✅ Node.js установлен:"
node --version
npm --version

# Установка MySQL
echo ""
echo "📦 Установка MySQL..."
apt-get install -y mysql-server

# Запуск MySQL
systemctl start mysql
systemctl enable mysql

# Установка Nginx
echo ""
echo "📦 Установка Nginx..."
apt-get install -y nginx

# Запуск Nginx
systemctl start nginx
systemctl enable nginx

# Установка PM2 глобально
echo ""
echo "📦 Установка PM2..."
npm install -g pm2

# Установка дополнительных утилит
echo ""
echo "📦 Установка дополнительных утилит..."
apt-get install -y git curl wget build-essential

# Создание директорий для проекта
echo ""
echo "📁 Создание директорий..."
mkdir -p /var/www/messager
mkdir -p /var/www/messager/backend
mkdir -p /var/www/messager/frontend-web
mkdir -p /var/www/messager/backend/uploads
mkdir -p /var/www/messager/backend/logs

# Установка прав
chown -R root:root /var/www/messager

echo ""
echo "=========================================="
echo "✅ Установка завершена!"
echo "=========================================="
echo ""
echo "Установлено:"
echo "  - Node.js: $(node --version)"
echo "  - npm: $(npm --version)"
echo "  - MySQL: $(mysql --version | head -1)"
echo "  - Nginx: $(nginx -v 2>&1)"
echo "  - PM2: $(pm2 --version)"
echo ""
echo "Следующие шаги:"
echo "  1. Перенести проект на VPS"
echo "  2. Настроить MySQL"
echo "  3. Настроить Nginx"
echo "  4. Запустить Backend"
echo ""
