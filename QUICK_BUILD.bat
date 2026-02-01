@echo off
echo ========================================
echo   СБОРКА APK MESSENGER
echo ========================================
echo.

cd /d c:\OSPanel\domains\Messager

echo Установка переменных окружения...
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_HOME=C:\Users\dsc-2\AppData\Local\Android\Sdk
set PATH=%PATH%;%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools

echo.
echo Запуск сборки APK...
echo Это займет 10-15 минут...
echo.

cd mobile\android
call gradlew.bat assembleRelease

echo.
echo ========================================
if exist "app\build\outputs\apk\release\app-release.apk" (
    echo   УСПЕХ! APK СОБРАН!
    echo ========================================
    echo.
    echo APK находится здесь:
    echo app\build\outputs\apk\release\app-release.apk
    echo.
    echo Размер файла:
    dir "app\build\outputs\apk\release\app-release.apk" | find "app-release.apk"
    echo.
    echo Загрузить на сервер:
    echo scp app\build\outputs\apk\release\app-release.apk root@89.169.39.244:/var/www/messenger/downloads/messenger-v1.0.0.apk
) else (
    echo   ОШИБКА СБОРКИ!
    echo ========================================
    echo.
    echo Проверьте лог выше для деталей
)

echo.
pause
