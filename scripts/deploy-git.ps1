# Быстрый деплой через Git: push, затем обновление на сервере.
# (Сначала push — чтобы сервер подтянул код; на сервере fetch+reset+скрипт.)
# Запуск из корня проекта: .\scripts\deploy-git.ps1

$SERVER = if ($env:DEPLOY_SERVER) { $env:DEPLOY_SERVER } else { "root@89.169.39.244" }
$SERVER_PATH = if ($env:DEPLOY_PATH) { $env:DEPLOY_PATH } else { "/var/www/messager" }

Write-Host "=== Deploy (Git, fast) ===" -ForegroundColor Green

# Сначала push — сервер подтянет этот код при fetch+reset
Write-Host "[1/2] Git push..." -ForegroundColor Yellow
$pushResult = git push 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host $pushResult -ForegroundColor Red
    Write-Host "Tip: commit first, or fix remote." -ForegroundColor Yellow
    exit 1
}

# Обновление на сервере: убрать CRLF, fetch+reset, затем сборка и перезапуск
Write-Host "[2/2] Server: fetch + build + restart..." -ForegroundColor Yellow
& ssh $SERVER "cd $SERVER_PATH && (sed -i 's/\r$//' scripts/*.sh 2>/dev/null; true) && git fetch origin && (git reset --hard origin/main 2>/dev/null || git reset --hard origin/master) && bash scripts/pull-and-update.sh"
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "=== Done ===" -ForegroundColor Green
