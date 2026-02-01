# Полностью автоматический деплой мессенджера
# Использование: .\scripts\auto-deploy.ps1 "commit message"

param(
    [string]$CommitMessage = "Auto deploy"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 АВТОМАТИЧЕСКИЙ ДЕПЛОЙ МЕССЕНДЖЕРА" -ForegroundColor Cyan
Write-Host ""

# 1. Локальные изменения
Write-Host "📝 Шаг 1: Git add, commit, push..." -ForegroundColor Yellow
try {
    git add .
    git commit -m $CommitMessage
    git push origin main
    Write-Host "✅ Изменения отправлены в репозиторий" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Нет изменений для коммита или ошибка git" -ForegroundColor Yellow
}

Write-Host ""

# 2. Деплой на сервер через SSH
Write-Host "📦 Шаг 2: Деплой на сервер..." -ForegroundColor Yellow

$deployScript = @'
#!/bin/bash
set -e

echo "🔄 Обновление кода из Git..."
cd /var/www/messager
git fetch origin
git reset --hard origin/main

echo "📦 Backend: копируем websocket.gateway.js..."
cd /var/www/messager/backend

# Копируем изменения в старую директорию где работает PM2
if [ -f "src/websocket/websocket.gateway.ts" ]; then
    # Компилируем TypeScript файл
    npx tsc src/websocket/websocket.gateway.ts --outDir temp-dist --skipLibCheck --esModuleInterop --experimentalDecorators --emitDecoratorMetadata --target es2020 --module commonjs 2>/dev/null || true
    
    # Копируем в рабочую директорию PM2
    if [ -f "temp-dist/websocket/websocket.gateway.js" ]; then
        cp temp-dist/websocket/websocket.gateway.js /var/www/messenger/backend/dist/websocket/websocket.gateway.js
        echo "✅ Backend файлы обновлены"
    fi
    rm -rf temp-dist
fi

echo "🏗️ Frontend build..."
cd /var/www/messager/frontend-web
npx vite build

echo "📁 Проверка uploads директорий..."
mkdir -p /var/www/messenger/backend/uploads/images
mkdir -p /var/www/messenger/backend/uploads/audio
mkdir -p /var/www/messenger/backend/uploads/videos
mkdir -p /var/www/messenger/backend/uploads/documents
chmod -R 777 /var/www/messenger/backend/uploads

echo "🔗 Обновление симлинка..."
rm -f /var/www/messager/backend/uploads
ln -sf /var/www/messenger/backend/uploads /var/www/messager/backend/uploads

echo "📋 Обновление nginx (download.html, downloads)..."
if [ -f /var/www/messager/nginx/messager-vps.conf ]; then
    sudo cp /var/www/messager/nginx/messager-vps.conf /etc/nginx/sites-available/messager
fi

echo "♻️ Перезапуск сервисов..."
pm2 restart messenger-api
sudo systemctl reload nginx

echo "⏳ Ждём 3 секунды..."
sleep 3

echo "🔍 Проверка статуса..."
pm2_status=$(pm2 list | grep messenger-api | grep online || echo "")
if [ -z "$pm2_status" ]; then
    echo "❌ Backend НЕ запущен!"
    pm2 logs messenger-api --lines 20 --nostream
    exit 1
fi

nginx_status=$(sudo systemctl is-active nginx)
if [ "$nginx_status" != "active" ]; then
    echo "❌ Nginx НЕ активен!"
    exit 1
fi

echo "✅ ВСЁ РАБОТАЕТ!"
echo ""
echo "📊 Статус PM2:"
pm2 list
echo ""
echo "📊 Последние логи (последние 5 строк):"
pm2 logs messenger-api --lines 5 --nostream
echo ""
echo "🌐 Сайт: https://neekloai.ru"
'@

Write-Host "Выполнение команд на сервере..." -ForegroundColor Cyan

# Создаём временный файл скрипта
$tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
$deployScript | Out-File -FilePath $tempScript -Encoding UTF8 -NoNewline

try {
    # Копируем скрипт на сервер
    scp $tempScript root@89.169.39.244:/tmp/deploy.sh
    
    # Выполняем скрипт на сервере
    ssh root@89.169.39.244 "chmod +x /tmp/deploy.sh && /tmp/deploy.sh && rm /tmp/deploy.sh"
    
    Write-Host ""
    Write-Host "✅ ДЕПЛОЙ ЗАВЕРШЁН УСПЕШНО!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Сайт: https://neekloai.ru" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 Не забудьте очистить кеш браузера (Ctrl+F5)" -ForegroundColor Yellow
} catch {
    Write-Host ""
    Write-Host "❌ ОШИБКА ДЕПЛОЯ!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
} finally {
    # Удаляем временный файл
    if (Test-Path $tempScript) {
        Remove-Item $tempScript
    }
}
