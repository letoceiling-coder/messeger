# Скрипт для настройки SSH с IP адресом

Write-Host "🔧 Настройка SSH подключения..." -ForegroundColor Green
Write-Host ""

Write-Host "Для подключения к серверу Beget нужен IP адрес." -ForegroundColor Yellow
Write-Host ""
Write-Host "Где найти IP адрес:" -ForegroundColor Cyan
Write-Host "1. В панели управления Beget → Информация о сервере" -ForegroundColor White
Write-Host "2. Или на сервере выполните: hostname -I" -ForegroundColor White
Write-Host ""

$ipAddress = Read-Host "Введите IP адрес сервера (например: 123.45.67.89)"

if ([string]::IsNullOrWhiteSpace($ipAddress)) {
    Write-Host "❌ IP адрес не введен" -ForegroundColor Red
    exit 1
}

# Проверка формата IP (базовая)
if ($ipAddress -notmatch '^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$') {
    Write-Host "⚠️  Похоже, что это не IP адрес. Продолжаем..." -ForegroundColor Yellow
}

$sshConfigPath = "$env:USERPROFILE\.ssh\config"
$keyPath = "$env:USERPROFILE\.ssh\id_rsa"

# Создание директории .ssh если не существует
if (-not (Test-Path "$env:USERPROFILE\.ssh")) {
    New-Item -ItemType Directory -Path "$env:USERPROFILE\.ssh" -Force | Out-Null
}

$configEntry = @"

# Messager Server
Host dragon
    HostName $ipAddress
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
        Write-Host "⚠️  Запись для dragon уже существует. Обновляю..." -ForegroundColor Yellow
        $content = Get-Content $sshConfigPath
        $newContent = @()
        $skip = $false
        foreach ($line in $content) {
            if ($line -match "^Host dragon$") {
                $skip = $true
            }
            if ($skip -and $line -match "^Host ") {
                $skip = $false
            }
            if (-not $skip) {
                $newContent += $line
            }
        }
        $newContent += $configEntry
        Set-Content -Path $sshConfigPath -Value $newContent
    } else {
        Add-Content -Path $sshConfigPath -Value $configEntry
    }
    Write-Host "✅ SSH config обновлен" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔍 Проверка подключения..." -ForegroundColor Yellow
$testResult = ssh -o ConnectTimeout=5 -o BatchMode=yes dragon "echo 'OK'" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Подключение работает без пароля!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Подключение требует пароль или ключ не настроен" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Попробуйте подключиться вручную:" -ForegroundColor Yellow
    Write-Host "ssh dragon" -ForegroundColor Cyan
    Write-Host "или" -ForegroundColor Yellow
    Write-Host "ssh dsc23ytp@$ipAddress" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✅ Настройка завершена!" -ForegroundColor Green
Write-Host ""
Write-Host "Теперь можно подключаться:" -ForegroundColor Yellow
Write-Host "ssh dragon" -ForegroundColor Cyan
Write-Host "или" -ForegroundColor Yellow
Write-Host "ssh dsc23ytp@$ipAddress" -ForegroundColor Cyan
