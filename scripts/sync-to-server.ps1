# PowerShell скрипт для синхронизации проекта с сервером через SSH

# Адрес сервера
$SERVER_ADDRESS = "5.101.156.207"  # IP адрес сервера
$SERVER = "dsc23ytp@$SERVER_ADDRESS"
$SERVER_PATH = "~/messager"

Write-Host "🚀 Синхронизация проекта с сервером..." -ForegroundColor Green

# Проверка подключения
Write-Host "📡 Проверка подключения к серверу ($SERVER)..." -ForegroundColor Yellow
$testConnection = ssh -o ConnectTimeout=5 $SERVER "echo 'OK'" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Не удалось подключиться к серверу" -ForegroundColor Red
    Write-Host "Проверьте:" -ForegroundColor Yellow
    Write-Host "  1. Адрес сервера правильный: $SERVER_ADDRESS" -ForegroundColor Cyan
    Write-Host "  2. SSH ключ добавлен на сервер" -ForegroundColor Cyan
    Write-Host "  3. Сервер доступен" -ForegroundColor Cyan
    exit 1
}

# Создание структуры на сервере
Write-Host "📁 Создание структуры директорий на сервере..." -ForegroundColor Yellow
ssh $SERVER "mkdir -p $SERVER_PATH/backend $SERVER_PATH/frontend-web $SERVER_PATH/mobile $SERVER_PATH/nginx" 2>&1 | Out-Null

# Проверка наличия rsync (Windows)
$rsyncAvailable = Get-Command rsync -ErrorAction SilentlyContinue
if (-not $rsyncAvailable) {
    Write-Host "⚠️  rsync не найден. Используется scp..." -ForegroundColor Yellow
    Write-Host "💡 Рекомендуется установить rsync через WSL или Git Bash для лучшей производительности" -ForegroundColor Yellow
    
    # Использование scp для синхронизации
    Write-Host "📦 Синхронизация Backend через scp..." -ForegroundColor Yellow
    scp -r -q backend/* $SERVER`:$SERVER_PATH/backend/ 2>&1 | Out-Null
    
    Write-Host "📦 Синхронизация Frontend через scp..." -ForegroundColor Yellow
    scp -r -q frontend-web/* $SERVER`:$SERVER_PATH/frontend-web/ 2>&1 | Out-Null
} else {
    # Синхронизация Backend
    Write-Host "📦 Синхронизация Backend..." -ForegroundColor Yellow
    rsync -avz --progress `
      --exclude 'node_modules' `
      --exclude '.git' `
      --exclude 'dist' `
      --exclude 'uploads' `
      --exclude 'logs' `
      --exclude '.env' `
      --exclude '.env.local' `
      backend/ $SERVER`:$SERVER_PATH/backend/

    # Синхронизация Frontend
    Write-Host "📦 Синхронизация Frontend..." -ForegroundColor Yellow
    rsync -avz --progress `
      --exclude 'node_modules' `
      --exclude '.git' `
      --exclude 'dist' `
      --exclude '.env' `
      --exclude '.env.local' `
      frontend-web/ $SERVER`:$SERVER_PATH/frontend-web/

    # Синхронизация Mobile (если существует)
    if (Test-Path "mobile") {
        Write-Host "📦 Синхронизация Mobile..." -ForegroundColor Yellow
        rsync -avz --progress `
          --exclude 'node_modules' `
          --exclude '.git' `
          --exclude '.expo' `
          mobile/ $SERVER`:$SERVER_PATH/mobile/
    }

    # Синхронизация конфигураций Nginx
    if (Test-Path "nginx") {
        Write-Host "⚙️  Синхронизация конфигураций Nginx..." -ForegroundColor Yellow
        rsync -avz --progress nginx/ $SERVER`:$SERVER_PATH/nginx/
    }
}

Write-Host "`n✅ Синхронизация завершена!" -ForegroundColor Green
Write-Host "💡 Для работы на сервере выполните: ssh $SERVER" -ForegroundColor Yellow
Write-Host "   Или используйте VS Code Remote SSH: F1 → Remote-SSH: Connect to Host" -ForegroundColor Yellow
