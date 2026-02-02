# Настройка SMSC и отправка тестового SMS на сервере.
# Использование:
#   1. Добавьте SMSC_LOGIN и SMSC_PASSWORD в переменные ниже (или в .env на сервере)
#   2. Запустите: .\setup-smsc-server.ps1
#   3. Скрипт создаст .env на сервере и отправит тестовое SMS

# Настройка SMSC на удалённом сервере
# Пароль SSH и SMSC — через переменные окружения (безопаснее) или задайте ниже
$SERVER = "89.169.39.244"
$USER = "root"
$SMSC_LOGIN = if ($env:SMSC_LOGIN) { $env:SMSC_LOGIN } else { "dsc-23" }
$SMSC_PASSWORD = if ($env:SMSC_PASSWORD) { $env:SMSC_PASSWORD } else { "Kucaevivan19" }
$TEST_PHONE = "89897625658"

$envContent = "SMSC_LOGIN=$SMSC_LOGIN`nSMSC_PASSWORD=$SMSC_PASSWORD"

Write-Host "Подключение к ${USER}@${SERVER}..."
$remoteCmd = @"
mkdir -p messager/backend
echo 'SMSC_LOGIN=$SMSC_LOGIN' >> messager/backend/.env
echo 'SMSC_PASSWORD=$SMSC_PASSWORD' >> messager/backend/.env
cd messager/backend && [ -f package.json ] && node scripts/send-test-sms.cjs $TEST_PHONE 'Messager: тестовое SMS. Код: 1234' || echo 'Скопируйте backend на сервер и запустите: node scripts/send-test-sms.cjs'
"@

ssh "${USER}@${SERVER}" $remoteCmd
