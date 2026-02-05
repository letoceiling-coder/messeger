# Deploy chat-hub-design (novyy dizayn) na server
# Ispolzovanie: .\scripts\deploy-chat-hub.ps1 "commit message"

param(
    [string]$CommitMessage = "Deploy chat-hub-design"
)

$ErrorActionPreference = "Stop"

Write-Host "Deploy chat-hub-design na server..." -ForegroundColor Cyan

# 1. Git
Write-Host "Git add, commit, push..." -ForegroundColor Yellow
try {
    git add .
    git commit -m $CommitMessage
    git push origin main
} catch {
    Write-Host "Net izmeneniy ili oshibka git" -ForegroundColor Yellow
}

$deployScript = @'
#!/bin/bash
set -e

echo "Obnovlenie koda..."
cd /var/www/messager
git fetch origin
git reset --hard origin/main

echo "Backend: npm ci, prisma db push, build..."
cd /var/www/messager/backend
npm ci
npx prisma db push 2>/dev/null || true
npm run build

echo "Chat-hub-design: npm ci, build..."
cd /var/www/messager/chat-hub-design
npm ci
[ -f .env.production ] || cp env.production.example .env.production 2>/dev/null || true
npm run build

echo "Uploads..."
mkdir -p /var/www/messager/backend/uploads/images /var/www/messager/backend/uploads/audio /var/www/messager/backend/uploads/videos /var/www/messager/backend/uploads/documents
chmod -R 777 /var/www/messager/backend/uploads

echo "Nginx: chat-hub-design config..."
sudo cp /var/www/messager/nginx/messager-vps-chat-hub.conf /etc/nginx/sites-available/messager
sudo nginx -t && sudo systemctl reload nginx

echo "PM2 restart..."
pm2 restart messenger-api
sleep 3

echo "Proverka..."
pm2 list | grep messenger-api
echo "Sait: https://neekloai.ru"
'@

$tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
$deployScript | Out-File -FilePath $tempScript -Encoding UTF8 -NoNewline

try {
    scp $tempScript root@89.169.39.244:/tmp/deploy-chat-hub.sh
    ssh root@89.169.39.244 "chmod +x /tmp/deploy-chat-hub.sh && /tmp/deploy-chat-hub.sh && rm /tmp/deploy-chat-hub.sh"
    Write-Host "Deploy zavershen!" -ForegroundColor Green
} catch {
    Write-Host "Oshibka deploy!" -ForegroundColor Red
    exit 1
} finally {
    if (Test-Path $tempScript) { Remove-Item $tempScript }
}
