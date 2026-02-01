# Автоматический поиск и настройка Java + Android SDK

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ПОИСК И НАСТРОЙКА ОКРУЖЕНИЯ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка прав администратора
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ВАЖНО: Запустите PowerShell от имени Администратора!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Нажмите Win+X → 'Windows PowerShell (Администратор)'" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Нажмите Enter для выхода"
    exit 1
}

Write-Host "🔍 Поиск Java JDK..." -ForegroundColor Yellow

# Поиск Java
$javaLocations = @(
    "C:\Program Files\Eclipse Adoptium",
    "C:\Program Files\Java",
    "C:\Program Files (x86)\Java",
    "C:\Program Files\Microsoft"
)

$javaHome = $null

foreach ($location in $javaLocations) {
    if (Test-Path $location) {
        $jdkFolders = Get-ChildItem $location -Directory -Filter "jdk*" -ErrorAction SilentlyContinue
        if ($jdkFolders) {
            $javaHome = $jdkFolders[0].FullName
            Write-Host "✅ Найден Java JDK: $javaHome" -ForegroundColor Green
            break
        }
    }
}

if (-not $javaHome) {
    Write-Host "❌ Java JDK не найден!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Введите путь к JDK вручную (например C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot):" -ForegroundColor Yellow
    $javaHome = Read-Host
    
    if (-not (Test-Path $javaHome)) {
        Write-Host "❌ Путь не существует! Проверьте установку Java." -ForegroundColor Red
        Read-Host "Enter для выхода"
        exit 1
    }
}

Write-Host ""
Write-Host "🔍 Поиск Android SDK..." -ForegroundColor Yellow

# Поиск Android SDK
$androidLocations = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:USERPROFILE\Android\Sdk",
    "C:\Android\Sdk",
    "C:\Program Files\Android\Sdk"
)

$androidHome = $null

foreach ($location in $androidLocations) {
    if (Test-Path $location) {
        $androidHome = $location
        Write-Host "✅ Найден Android SDK: $androidHome" -ForegroundColor Green
        break
    }
}

if (-not $androidHome) {
    Write-Host "⚠️  Android SDK не найден автоматически" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Откройте Android Studio → More Actions → SDK Manager" -ForegroundColor Cyan
    Write-Host "Скопируйте путь 'Android SDK Location' и вставьте сюда:" -ForegroundColor Cyan
    Write-Host ""
    $androidHome = Read-Host "Путь к Android SDK"
    
    if (-not (Test-Path $androidHome)) {
        Write-Host "❌ Путь не существует!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Установите SDK через Android Studio:" -ForegroundColor Yellow
        Write-Host "  1. Откройте Android Studio" -ForegroundColor White
        Write-Host "  2. More Actions → SDK Manager" -ForegroundColor White
        Write-Host "  3. Установите Android SDK (API 34)" -ForegroundColor White
        Write-Host ""
        Read-Host "Enter для выхода"
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  УСТАНОВКА ПЕРЕМЕННЫХ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Установить JAVA_HOME
try {
    [System.Environment]::SetEnvironmentVariable('JAVA_HOME', $javaHome, 'User')
    Write-Host "✅ JAVA_HOME = $javaHome" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка установки JAVA_HOME: $_" -ForegroundColor Red
}

# Установить ANDROID_HOME
try {
    [System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $androidHome, 'User')
    Write-Host "✅ ANDROID_HOME = $androidHome" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка установки ANDROID_HOME: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "📝 Обновление PATH..." -ForegroundColor Yellow

# Обновить PATH
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')

$pathsToAdd = @(
    "$javaHome\bin",
    "$androidHome\platform-tools",
    "$androidHome\tools",
    "$androidHome\tools\bin",
    "$androidHome\cmdline-tools\latest\bin"
)

$added = 0
foreach ($path in $pathsToAdd) {
    if ($currentPath -notlike "*$path*") {
        $currentPath += ";$path"
        Write-Host "  + $path" -ForegroundColor Cyan
        $added++
    }
}

try {
    [System.Environment]::SetEnvironmentVariable('Path', $currentPath, 'User')
    Write-Host ""
    Write-Host "✅ PATH обновлён ($added путей добавлено)" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка обновления PATH: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ НАСТРОЙКА ЗАВЕРШЕНА!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  ВАЖНО: Перезапустите PowerShell!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Затем проверьте в НОВОМ окне PowerShell:" -ForegroundColor Cyan
Write-Host '  java -version' -ForegroundColor White
Write-Host '  echo $env:JAVA_HOME' -ForegroundColor White
Write-Host '  echo $env:ANDROID_HOME' -ForegroundColor White
Write-Host ""
Write-Host "Если всё ОК, продолжайте:" -ForegroundColor Cyan
Write-Host '  cd c:\OSPanel\domains\Messager\mobile' -ForegroundColor White
Write-Host '  npm install' -ForegroundColor White
Write-Host ""

Read-Host "Нажмите Enter для выхода"
