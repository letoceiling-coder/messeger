# Добавление MAIL и AUTH_MODE в .env.production на сервере
# Задайте переменные: $env:MAIL_USERNAME="..."; $env:MAIL_PASSWORD="..."
# Или отредактируйте значения ниже перед запуском
$SERVER = "89.169.39.244"
$USER = "root"
$BACKEND = "/var/www/messager/backend"

$MAIL_HOST = if ($env:MAIL_HOST) { $env:MAIL_HOST } else { "smtp.beget.com" }
$MAIL_PORT = if ($env:MAIL_PORT) { $env:MAIL_PORT } else { "465" }
$MAIL_USERNAME = if ($env:MAIL_USERNAME) { $env:MAIL_USERNAME } else { "info@neeklo.ru" }
$MAIL_PASSWORD = if ($env:MAIL_PASSWORD) { $env:MAIL_PASSWORD } else { "" }
$MAIL_FROM = if ($env:MAIL_FROM) { $env:MAIL_FROM } else { $MAIL_USERNAME }
$AUTH_MODE = if ($env:AUTH_MODE) { $env:AUTH_MODE } else { "both" }

if (-not $MAIL_PASSWORD) {
    Write-Host "Задайте MAIL_PASSWORD: `$env:MAIL_PASSWORD='yourpass'" -ForegroundColor Yellow
    exit 1
}

$block = "MAIL_HOST=$MAIL_HOST`nMAIL_PORT=$MAIL_PORT`nMAIL_USERNAME=$MAIL_USERNAME`nMAIL_PASSWORD=$MAIL_PASSWORD`nMAIL_FROM=$MAIL_FROM`nAUTH_MODE=$AUTH_MODE"
ssh "${USER}@${SERVER}" "cd $BACKEND; grep -q '^MAIL_HOST=' .env.production 2>/dev/null || echo '$block' >> .env.production; echo Done"
