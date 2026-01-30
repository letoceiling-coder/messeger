# PowerShell скрипт для синхронизации проекта с сервером через SSH (исправленная версия)

$SERVER_ADDRESS = "5.101.156.207"
$SERVER = "dsc23ytp@$SERVER_ADDRESS"
$SERVER_PATH = "~/messager"

Write-Host "🚀 Синхронизация проекта с сервером..." -ForegroundColor Green

# Проверка подключения
Write-Host "📡 Проверка подключения..." -ForegroundColor Yellow
$testResult = ssh -o ConnectTimeout=5 $SERVER "echo 'OK'" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Не удалось подключиться к серверу" -ForegroundColor Red
    exit 1
}

# Создание структуры
Write-Host "📁 Создание структуры на сервере..." -ForegroundColor Yellow
ssh $SERVER "mkdir -p $SERVER_PATH/backend $SERVER_PATH/frontend-web $SERVER_PATH/mobile $SERVER_PATH/nginx" 2>&1 | Out-Null

# Синхронизация Backend
Write-Host "📦 Синхронизация Backend..." -ForegroundColor Yellow
Get-ChildItem -Path "backend" -Exclude "node_modules","dist",".git","uploads","logs",".env",".env.local" | ForEach-Object {
    if ($_.PSIsContainer) {
        scp -r "$($_.FullName)" "${SERVER}:${SERVER_PATH}/backend/" 2>&1 | Out-Null
    } else {
        scp "$($_.FullName)" "${SERVER}:${SERVER_PATH}/backend/" 2>&1 | Out-Null
    }
}

# Синхронизация Frontend
Write-Host "📦 Синхронизация Frontend..." -ForegroundColor Yellow
Get-ChildItem -Path "frontend-web" -Exclude "node_modules","dist",".git",".env",".env.local" | ForEach-Object {
    if ($_.PSIsContainer) {
        scp -r "$($_.FullName)" "${SERVER}:${SERVER_PATH}/frontend-web/" 2>&1 | Out-Null
    } else {
        scp "$($_.FullName)" "${SERVER}:${SERVER_PATH}/frontend-web/" 2>&1 | Out-Null
    }
}

# Синхронизация Mobile (если есть)
if (Test-Path "mobile") {
    Write-Host "📦 Синхронизация Mobile..." -ForegroundColor Yellow
    Get-ChildItem -Path "mobile" -Exclude "node_modules",".git",".expo" | ForEach-Object {
        if ($_.PSIsContainer) {
            scp -r "$($_.FullName)" "${SERVER}:${SERVER_PATH}/mobile/" 2>&1 | Out-Null
        } else {
            scp "$($_.FullName)" "${SERVER}:${SERVER_PATH}/mobile/" 2>&1 | Out-Null
        }
    }
}

# Синхронизация Nginx (если есть)
if (Test-Path "nginx") {
    Write-Host "⚙️  Синхронизация Nginx конфигураций..." -ForegroundColor Yellow
    scp -r nginx/* "${SERVER}:${SERVER_PATH}/nginx/" 2>&1 | Out-Null
}

Write-Host "`n✅ Синхронизация завершена!" -ForegroundColor Green
Write-Host "💡 Проверьте файлы на сервере: ssh $SERVER 'ls -la ~/messager/backend/'" -ForegroundColor Yellow
