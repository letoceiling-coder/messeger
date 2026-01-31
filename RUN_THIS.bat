@echo off
echo ========================================
echo ЗАПУСК GIT BASH ДЛЯ ДЕПЛОЯ
echo ========================================
echo.

cd /d "%~dp0"

if exist "C:\Program Files\Git\git-bash.exe" (
    start "" "C:\Program Files\Git\git-bash.exe" --cd="%CD%" -c "./scripts/deploy-simple.sh"
) else if exist "C:\Program Files (x86)\Git\git-bash.exe" (
    start "" "C:\Program Files (x86)\Git\git-bash.exe" --cd="%CD%" -c "./scripts/deploy-simple.sh"
) else (
    echo Git Bash не найден!
    echo.
    echo Пожалуйста:
    echo 1. Найдите "Git Bash" в меню Пуск
    echo 2. Откройте Git Bash
    echo 3. Выполните:
    echo    cd /c/OSPanel/domains/Messager
    echo    chmod +x scripts/deploy-simple.sh
    echo    ./scripts/deploy-simple.sh
    echo.
    pause
)
