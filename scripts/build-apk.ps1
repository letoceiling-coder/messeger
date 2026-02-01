# Скрипт сборки Android APK

param(
    [switch]$Clean,
    [switch]$Upload
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  СБОРКА ANDROID APK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Пути
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$mobileDir = Join-Path $projectRoot "mobile"
$androidDir = Join-Path $mobileDir "android"
$apkPath = Join-Path $androidDir "app\build\outputs\apk\release\app-release.apk"

Write-Host "📂 Проект: $projectRoot" -ForegroundColor Gray
Write-Host "📂 Mobile: $mobileDir" -ForegroundColor Gray
Write-Host ""

# Проверка окружения
Write-Host "🔍 Проверка окружения..." -ForegroundColor Yellow
Write-Host ""

# Проверка Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js не найден!" -ForegroundColor Red
    exit 1
}

# Проверка Java
try {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    Write-Host "✅ Java: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Java не найден!" -ForegroundColor Red
    Write-Host "   Установите Java JDK 17+: https://adoptium.net" -ForegroundColor Yellow
    exit 1
}

# Проверка ANDROID_HOME
if (-not $env:ANDROID_HOME) {
    Write-Host "❌ ANDROID_HOME не установлен!" -ForegroundColor Red
    Write-Host "   Запустите: .\scripts\setup-android-env.ps1" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $env:ANDROID_HOME)) {
    Write-Host "❌ Android SDK не найден: $env:ANDROID_HOME" -ForegroundColor Red
    exit 1
}

Write-Host "✅ ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green
Write-Host ""

# Переход в mobile директорию
Set-Location $mobileDir

# Проверка node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Установка зависимостей..." -ForegroundColor Yellow
    Write-Host ""
    npm install
    Write-Host ""
    Write-Host "✅ Зависимости установлены" -ForegroundColor Green
    Write-Host ""
}

# Переход в android
Set-Location $androidDir

# Clean build если нужно
if ($Clean) {
    Write-Host "🧹 Очистка предыдущей сборки..." -ForegroundColor Yellow
    Write-Host ""
    
    if (Test-Path ".\gradlew.bat") {
        .\gradlew.bat clean
    } else {
        Write-Host "⚠️  gradlew.bat не найден, пропускаю clean" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

# Проверка gradlew
if (-not (Test-Path ".\gradlew.bat")) {
    Write-Host "⚠️  gradlew.bat не найден!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Инициализация gradle wrapper..." -ForegroundColor Yellow
    
    # Попытка создать wrapper
    if (Get-Command gradle -ErrorAction SilentlyContinue) {
        gradle wrapper
        Write-Host "✅ Gradle wrapper создан" -ForegroundColor Green
    } else {
        Write-Host "❌ Gradle не найден!" -ForegroundColor Red
        Write-Host "   Установите через Android Studio или вручную" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host ""
}

# Сборка APK
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🏗️  СБОРКА RELEASE APK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏳ Это может занять 5-10 минут при первой сборке..." -ForegroundColor Yellow
Write-Host ""

$buildStart = Get-Date

try {
    .\gradlew.bat assembleRelease
    
    $buildEnd = Get-Date
    $buildTime = ($buildEnd - $buildStart).TotalSeconds
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ СБОРКА ЗАВЕРШЕНА!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "⏱️  Время сборки: $([math]::Round($buildTime, 1)) секунд" -ForegroundColor Cyan
    Write-Host ""
    
    # Проверка APK
    if (Test-Path $apkPath) {
        $apkSize = (Get-Item $apkPath).Length / 1MB
        Write-Host "📦 APK создан:" -ForegroundColor Green
        Write-Host "   $apkPath" -ForegroundColor White
        Write-Host "   Размер: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Cyan
        Write-Host ""
        
        # Загрузка на сервер если нужно
        if ($Upload) {
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host "  📤 ЗАГРУЗКА НА СЕРВЕР" -ForegroundColor Cyan
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host ""
            
            $serverPath = "root@89.169.39.244:/var/www/messenger/downloads/messenger-v1.0.0.apk"
            
            Write-Host "Загрузка на: $serverPath" -ForegroundColor Yellow
            Write-Host ""
            
            scp $apkPath $serverPath
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "✅ APK загружен на сервер!" -ForegroundColor Green
                Write-Host ""
                Write-Host "Доступен по адресу:" -ForegroundColor Cyan
                Write-Host "  http://89.169.39.244/downloads/messenger-v1.0.0.apk" -ForegroundColor White
                Write-Host ""
            } else {
                Write-Host ""
                Write-Host "❌ Ошибка загрузки на сервер" -ForegroundColor Red
                Write-Host ""
            }
        } else {
            Write-Host "💡 Для загрузки на сервер запустите с флагом -Upload:" -ForegroundColor Yellow
            Write-Host "   .\scripts\build-apk.ps1 -Upload" -ForegroundColor White
            Write-Host ""
        }
        
        Write-Host "🎯 Следующие шаги:" -ForegroundColor Cyan
        Write-Host "  1. Протестируйте APK на Android устройстве" -ForegroundColor White
        Write-Host "  2. Загрузите на сервер (если еще не загружен)" -ForegroundColor White
        Write-Host "  3. Обновите страницу download.html" -ForegroundColor White
        Write-Host ""
        
    } else {
        Write-Host "❌ APK не найден после сборки!" -ForegroundColor Red
        Write-Host "   Ожидается: $apkPath" -ForegroundColor Gray
        exit 1
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Ошибка сборки!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Ошибка: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Попробуйте:" -ForegroundColor Yellow
    Write-Host "  1. .\scripts\build-apk.ps1 -Clean" -ForegroundColor White
    Write-Host "  2. Проверьте логи выше" -ForegroundColor White
    Write-Host "  3. См. SETUP_ANDROID_SDK.md для troubleshooting" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "Нажмите любую клавишу для выхода..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
