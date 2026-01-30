# Deploy: sync code to server + run update on server.
# Run from project root: .\scripts\deploy-update.ps1

$SERVER = if ($env:DEPLOY_SERVER) { $env:DEPLOY_SERVER } else { "root@89.169.39.244" }
$SERVER_PATH = if ($env:DEPLOY_PATH) { $env:DEPLOY_PATH } else { "/var/www/messager" }

Write-Host "=== Deploy: sync and update on server ===" -ForegroundColor Green

Write-Host "[1/2] Syncing code to server..." -ForegroundColor Yellow
$rsync = Get-Command rsync -ErrorAction SilentlyContinue
if ($rsync) {
  rsync -avz --delete --exclude 'node_modules' --exclude '.git' --exclude 'frontend-web/dist' --exclude 'backend/dist' --exclude 'backend/uploads' --exclude 'backend/logs' --exclude 'backend/.env' --exclude 'backend/.env.production' ./backend/ "${SERVER}:${SERVER_PATH}/backend/"
  rsync -avz --delete --exclude 'node_modules' --exclude '.git' --exclude 'dist' ./frontend-web/ "${SERVER}:${SERVER_PATH}/frontend-web/"
  rsync -avz ./scripts/ "${SERVER}:${SERVER_PATH}/scripts/"
} else {
  scp -r backend/* "${SERVER}:${SERVER_PATH}/backend/"
  scp -r frontend-web/* "${SERVER}:${SERVER_PATH}/frontend-web/"
  scp -r scripts/* "${SERVER}:${SERVER_PATH}/scripts/"
}

Write-Host "[2/2] Running update on server..." -ForegroundColor Yellow
$remoteCmd = "cd $SERVER_PATH; bash scripts/update-on-server.sh"
& ssh $SERVER $remoteCmd

Write-Host "=== Done ===" -ForegroundColor Green
