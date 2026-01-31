# Скрипт настройки переменных окружения для Android

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  НАСТРОЙКА ANDROID SDK ОКРУЖЕНИЯ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка прав администратора
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ Запустите PowerShell от имени Администратора!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Нажмите любую клавишу для выхода..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Пути (настройте под свою систему)
$androidSdk = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
$javaHome = "C:\Program Files\Eclipse Adoptium\jdk-17.0.13.11-hotspot"

Write-Host "📋 Проверка путей..." -ForegroundColor Yellow
Write-Host ""

# Проверка существования Android SDK
if (Test-Path $androidSdk) {
    Write-Host "✅ Android SDK найден: $androidSdk" -ForegroundColor Green
} else {
    Write-Host "⚠️  Android SDK не найден: $androidSdk" -ForegroundColor Yellow
    Write-Host "   Установите Android Studio сначала!" -ForegroundColor Yellow
    
    # Попробовать найти альтернативный путь
    $altPath = "C:\Android\Sdk"
    if (Test-Path $altPath) {
        Write-Host "✅ Найден альтернативный путь: $altPath" -ForegroundColor Green
        $androidSdk = $altPath
    } else {
        Write-Host ""
        Write-Host "Введите путь к Android SDK вручную (или Enter для пропуска):"
        $userPath = Read-Host
        if ($userPath -and (Test-Path $userPath)) {
            $androidSdk = $userPath
            Write-Host "✅ Использую: $androidSdk" -ForegroundColor Green
        } else {
            Write-Host "❌ Пропускаю настройку ANDROID_HOME" -ForegroundColor Red
            $androidSdk = $null
        }
    }
}

Write-Host ""

# Проверка Java
if (Test-Path $javaHome) {
    Write-Host "✅ Java JDK найден: $javaHome" -ForegroundColor Green
} else {
    Write-Host "⚠️  Java JDK не найден: $javaHome" -ForegroundColor Yellow
    
    # Поиск Java в Program Files
    $javaSearchPaths = @(
        "C:\Program Files\Eclipse Adoptium\jdk-*",
        "C:\Program Files\Java\jdk-*",
        "C:\Program Files\Microsoft\jdk-*"
    )
    
    foreach ($searchPath in $javaSearchPaths) {
        $found = Get-Item $searchPath -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $javaHome = $found.FullName
            Write-Host "✅ Найден Java JDK: $javaHome" -ForegroundColor Green
            break
        }
    }
    
    if (-not (Test-Path $javaHome)) {
        Write-Host "⚠️  Установите Java JDK 17+ отсюда:" -ForegroundColor Yellow
        Write-Host "   https://adoptium.net/temurin/releases/?version=17" -ForegroundColor Cyan
        $javaHome = $null
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  УСТАНОВКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Установить ANDROID_HOME
if ($androidSdk) {
    [System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $androidSdk, 'User')
    Write-Host "✅ ANDROID_HOME = $androidSdk" -ForegroundColor Green
}

# Установить JAVA_HOME
if ($javaHome) {
    [System.Environment]::SetEnvironmentVariable('JAVA_HOME', $javaHome, 'User')
    Write-Host "✅ JAVA_HOME = $javaHome" -ForegroundColor Green
}

# Добавить в PATH
Write-Host ""
Write-Host "📝 Обновление PATH..." -ForegroundColor Yellow

$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$pathsToAdd = @()

if ($androidSdk) {
    $pathsToAdd += "$androidSdk\platform-tools"
    $pathsToAdd += "$androidSdk\tools"
    $pathsToAdd += "$androidSdk\tools\bin"
}

if ($javaHome) {
    $pathsToAdd += "$javaHome\bin"
}

$added = 0
foreach ($path in $pathsToAdd) {
    if ($currentPath -notlike "*$path*") {
        $currentPath += ";$path"
        Write-Host "  + $path" -ForegroundColor Cyan
        $added++
    } else {
        Write-Host "  ✓ $path (уже есть)" -ForegroundColor Gray
    }
}

if ($added -gt 0) {
    [System.Environment]::SetEnvironmentVariable('Path', $currentPath, 'User')
    Write-Host ""
    Write-Host "✅ Добавлено $added путей в PATH" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "✅ PATH уже настроен" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ГОТОВО!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  ВАЖНО: Перезапустите PowerShell!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Проверьте настройки новой команд в НОВОМ окне PowerShell:" -ForegroundColor Cyan
Write-Host '  echo $env:ANDROID_HOME' -ForegroundColor White
Write-Host '  echo $env:JAVA_HOME' -ForegroundColor White
Write-Host '  java -version' -ForegroundColor White
Write-Host '  adb version' -ForegroundColor White
Write-Host ""
Write-Host "Нажмите любую клавишу для выхода..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
