# Простая настройка SSH для Windows

Write-Host "🔧 Настройка SSH для работы с сервером..." -ForegroundColor Green

# Показ публичного ключа
$pubKeyPath = "$env:USERPROFILE\.ssh\id_rsa.pub"
if (Test-Path $pubKeyPath) {
    Write-Host "`n📋 Ваш публичный SSH ключ:" -ForegroundColor Yellow
    $publicKey = Get-Content $pubKeyPath
    Write-Host $publicKey -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "📋 Скопируйте ключ выше и выполните на сервере:" -ForegroundColor Yellow
    Write-Host "ssh dsc23ytp@ВАШ_СЕРВЕР" -ForegroundColor Cyan
    Write-Host "mkdir -p ~/.ssh" -ForegroundColor Cyan
    Write-Host "echo '$publicKey' >> ~/.ssh/authorized_keys" -ForegroundColor Cyan
    Write-Host "chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Cyan
    Write-Host "chmod 700 ~/.ssh" -ForegroundColor Cyan
} else {
    Write-Host "❌ SSH ключ не найден. Создайте его:" -ForegroundColor Red
    Write-Host "ssh-keygen -t rsa -b 4096" -ForegroundColor Yellow
}

# Настройка SSH config
Write-Host "`n⚙️  Настройка SSH config..." -ForegroundColor Yellow
$sshConfigPath = "$env:USERPROFILE\.ssh\config"
$keyPath = "$env:USERPROFILE\.ssh\id_rsa"

Write-Host "Введите адрес сервера (IP или домен):" -ForegroundColor Yellow
Write-Host "Пример: parser-auto.site-access.ru или IP адрес" -ForegroundColor Cyan
$serverAddress = Read-Host "Адрес сервера"
if ([string]::IsNullOrWhiteSpace($serverAddress)) {
    $serverAddress = "parser-auto.site-access.ru"
    Write-Host "Используется адрес по умолчанию: $serverAddress" -ForegroundColor Yellow
}

if ($serverAddress) {
    $configEntry = @"

# Messager Server
Host dragon
    HostName $serverAddress
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
            # Удаление старой записи и добавление новой
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
    
    Write-Host "`n✅ Настройка завершена!" -ForegroundColor Green
    Write-Host "`n💡 Следующие шаги:" -ForegroundColor Yellow
    Write-Host "1. Скопируйте SSH ключ на сервер (команды выше)" -ForegroundColor Cyan
    Write-Host "2. Проверьте подключение: ssh dragon" -ForegroundColor Cyan
    Write-Host "3. Создайте структуру: ssh dragon 'mkdir -p ~/messager/{backend,frontend-web,mobile,nginx}'" -ForegroundColor Cyan
    Write-Host "4. Синхронизируйте файлы: .\scripts\sync-to-server.ps1" -ForegroundColor Cyan
} else {
    Write-Host "❌ Адрес сервера не введен" -ForegroundColor Red
}
