# Автоматическая настройка SSH для Windows

Write-Host "🔧 Настройка SSH для работы с сервером dragon..." -ForegroundColor Green

# Проверка SSH
Write-Host "`n📡 Проверка SSH..." -ForegroundColor Yellow
$sshVersion = ssh -V 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SSH установлен: $sshVersion" -ForegroundColor Green
} else {
    Write-Host "❌ SSH не установлен. Установите OpenSSH:" -ForegroundColor Red
    Write-Host "   Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0" -ForegroundColor Yellow
    exit 1
}

# Проверка/создание директории .ssh
Write-Host "`n📁 Проверка директории .ssh..." -ForegroundColor Yellow
$sshDir = "$env:USERPROFILE\.ssh"
if (-not (Test-Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
    Write-Host "✅ Директория .ssh создана" -ForegroundColor Green
} else {
    Write-Host "✅ Директория .ssh существует" -ForegroundColor Green
}

# Проверка/создание SSH ключа
Write-Host "`n🔑 Проверка SSH ключа..." -ForegroundColor Yellow
$keyPath = "$sshDir\id_rsa"
$pubKeyPath = "$sshDir\id_rsa.pub"

if (-not (Test-Path $keyPath)) {
    Write-Host "🔑 Создание нового SSH ключа..." -ForegroundColor Yellow
    ssh-keygen -t rsa -b 4096 -f $keyPath -N '""' -C "messager-deployment"
    Write-Host "✅ SSH ключ создан" -ForegroundColor Green
} else {
    Write-Host "✅ SSH ключ уже существует" -ForegroundColor Green
}

# Показ публичного ключа
Write-Host "`n📋 Ваш публичный ключ:" -ForegroundColor Yellow
$publicKey = Get-Content $pubKeyPath
Write-Host $publicKey -ForegroundColor Cyan

# Копирование ключа на сервер
Write-Host "`n📤 Копирование ключа на сервер..." -ForegroundColor Yellow
Write-Host "Введите пароль для dsc23ytp@dragon (если требуется):" -ForegroundColor Yellow

$copyCommand = "type $pubKeyPath | ssh dsc23ytp@dragon `"mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys`""
Invoke-Expression $copyCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Ключ скопирован на сервер" -ForegroundColor Green
} else {
    Write-Host "⚠️  Не удалось скопировать ключ автоматически" -ForegroundColor Yellow
    Write-Host "Скопируйте ключ вручную:" -ForegroundColor Yellow
    Write-Host $publicKey -ForegroundColor Cyan
    Write-Host "`nИ выполните на сервере:" -ForegroundColor Yellow
    Write-Host "mkdir -p ~/.ssh" -ForegroundColor Cyan
    Write-Host "echo '$publicKey' >> ~/.ssh/authorized_keys" -ForegroundColor Cyan
    Write-Host "chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Cyan
}

# Настройка SSH config
Write-Host "`n⚙️  Настройка SSH config..." -ForegroundColor Yellow
$sshConfigPath = "$sshDir\config"
$configEntry = @"

# Messager Server
Host dragon
    HostName dragon
    User dsc23ytp
    IdentityFile $keyPath
    ServerAliveInterval 60
    ServerAliveCountMax 3
    ForwardAgent yes
"@

if (-not (Test-Path $sshConfigPath)) {
    Set-Content -Path $sshConfigPath -Value $configEntry
    Write-Host "✅ SSH config создан" -ForegroundColor Green
} else {
    if (Select-String -Path $sshConfigPath -Pattern "Host dragon" -Quiet) {
        Write-Host "✅ Запись для dragon уже существует в config" -ForegroundColor Green
    } else {
        Add-Content -Path $sshConfigPath -Value $configEntry
        Write-Host "✅ Запись добавлена в SSH config" -ForegroundColor Green
    }
}

# Проверка подключения
Write-Host "`n🔍 Проверка подключения..." -ForegroundColor Yellow
$testResult = ssh -o ConnectTimeout=5 -o BatchMode=yes dragon "echo 'OK'" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Подключение работает без пароля!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Подключение требует пароль или ключ не настроен" -ForegroundColor Yellow
    Write-Host "Попробуйте подключиться вручную:" -ForegroundColor Yellow
    Write-Host "ssh dragon" -ForegroundColor Cyan
}

# Создание структуры на сервере
Write-Host "`n📁 Создание структуры на сервере..." -ForegroundColor Yellow
$createStructure = ssh dragon "mkdir -p ~/messager/{backend,frontend-web,mobile,nginx} 2>&1"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Структура создана на сервере" -ForegroundColor Green
} else {
    Write-Host "⚠️  Не удалось создать структуру автоматически" -ForegroundColor Yellow
    Write-Host "Выполните на сервере вручную:" -ForegroundColor Yellow
    Write-Host "mkdir -p ~/messager/backend" -ForegroundColor Cyan
    Write-Host "mkdir -p ~/messager/frontend-web" -ForegroundColor Cyan
    Write-Host "mkdir -p ~/messager/mobile" -ForegroundColor Cyan
    Write-Host "mkdir -p ~/messager/nginx" -ForegroundColor Cyan
}

Write-Host "`n✅ Настройка завершена!" -ForegroundColor Green
Write-Host "`n💡 Следующие шаги:" -ForegroundColor Yellow
Write-Host "1. Синхронизация файлов: .\scripts\sync-to-server.ps1" -ForegroundColor Cyan
Write-Host "2. Или используйте Git Bash: ./scripts/sync-to-server.sh" -ForegroundColor Cyan
Write-Host "3. VS Code Remote SSH: F1 → Remote-SSH: Connect to Host → dragon" -ForegroundColor Cyan
