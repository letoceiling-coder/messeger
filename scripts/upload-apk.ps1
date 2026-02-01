# Загрузка APK на сервер
# Использование: .\scripts\upload-apk.ps1

$apkPath = "c:\OSPanel\domains\Messager\mobile\android\app\build\outputs\apk\release\app-release.apk"
$server = "root@89.169.39.244"
$remotePath = "/var/www/messenger/downloads/messenger-v1.0.0.apk"

if (-not (Test-Path $apkPath)) {
    Write-Host "Ошибка: APK не найден. Сначала соберите: cd mobile\android; .\gradlew.bat assembleRelease" -ForegroundColor Red
    exit 1
}

Write-Host "Загрузка APK на сервер..." -ForegroundColor Cyan
scp $apkPath "${server}:${remotePath}"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nAPK загружен!" -ForegroundColor Green
    Write-Host "`nСсылки для скачивания:" -ForegroundColor Yellow
    Write-Host "  http://89.169.39.244/download.html" -ForegroundColor White
    Write-Host "  http://89.169.39.244/downloads/messenger-v1.0.0.apk" -ForegroundColor White
} else {
    Write-Host "Ошибка загрузки. Проверьте SSH подключение." -ForegroundColor Red
    exit 1
}
