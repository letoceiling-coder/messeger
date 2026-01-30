# Скрипт для автоматического добавления хоста в known_hosts

$SERVER_IP = "5.101.156.207"
$KNOWN_HOSTS = "$env:USERPROFILE\.ssh\known_hosts"

Write-Host "🔧 Добавление хоста в known_hosts..." -ForegroundColor Green

# Создать директорию .ssh если не существует
if (-not (Test-Path "$env:USERPROFILE\.ssh")) {
    New-Item -ItemType Directory -Path "$env:USERPROFILE\.ssh" -Force | Out-Null
}

# Добавить хост в known_hosts
Write-Host "📝 Добавление $SERVER_IP в known_hosts..." -ForegroundColor Yellow

# Удалить старую запись если есть
if (Test-Path $KNOWN_HOSTS) {
    $content = Get-Content $KNOWN_HOSTS
    $newContent = $content | Where-Object { $_ -notmatch $SERVER_IP }
    Set-Content -Path $KNOWN_HOSTS -Value $newContent
}

# Добавить новую запись
ssh-keyscan -H $SERVER_IP 2>$null | Add-Content -Path $KNOWN_HOSTS

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Хост добавлен в known_hosts" -ForegroundColor Green
} else {
    Write-Host "⚠️  Не удалось автоматически добавить хост" -ForegroundColor Yellow
    Write-Host "Выполните вручную при первом подключении и ответьте 'yes'" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔍 Проверка подключения..." -ForegroundColor Yellow
$testResult = ssh -o ConnectTimeout=5 -o BatchMode=yes dsc23ytp@$SERVER_IP "echo 'OK'" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Подключение работает без пароля!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Подключение требует пароль или ключ не настроен" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Попробуйте подключиться вручную:" -ForegroundColor Yellow
    Write-Host "ssh dsc23ytp@$SERVER_IP" -ForegroundColor Cyan
    Write-Host "Ответьте 'yes' на вопрос о host key" -ForegroundColor Yellow
}
