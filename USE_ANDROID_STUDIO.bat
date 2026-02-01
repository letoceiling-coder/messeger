@echo off
echo ========================================
echo   ОТКРЫТЬ ПРОЕКТ В ANDROID STUDIO
echo ========================================
echo.
echo 1. Откроется Android Studio
echo 2. File -^> Open
echo 3. Выберите: c:\OSPanel\domains\Messager\mobile\android
echo 4. Дождитесь синхронизации Gradle
echo 5. Build -^> Build Bundle(s) / APK(s) -^> Build APK(s)
echo.
echo Запускаю Android Studio...
echo.

start "" "C:\Program Files\Android\Android Studio\bin\studio64.exe" "c:\OSPanel\domains\Messager\mobile\android"

echo.
echo Android Studio запущен!
echo Следуйте инструкциям выше в Android Studio
echo.
pause
