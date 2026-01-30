# Деплой через Git (рекомендуемый способ)

Репозиторий: **https://github.com/letoceiling-coder/messeger.git**

## Схема

1. **Локально:** правки кода → сборка (по желанию) → `git add` → `git commit` → `git push`
2. **На сервере:** `cd /var/www/messager && bash scripts/pull-and-update.sh` — подтянуть код, собрать, перезапустить.

Так не нужен rsync/scp с вашего ПК: сервер сам тянет код из GitHub и обновляется.

## Первоначальная настройка (один раз)

### Локально

```bash
cd c:\OSPanel\domains\Messager
git init
git remote add origin https://github.com/letoceiling-coder/messeger.git
git add .
git commit -m "Initial"
git branch -M main
git push -u origin main
```

### На сервере

```bash
cd /var/www/messager
# Если папка пустая — клонировать:
# git clone https://github.com/letoceiling-coder/messeger.git .
# Либо если проект уже скопирован — подключить remote и подтянуть:
git remote add origin https://github.com/letoceiling-coder/messeger.git
git fetch origin
git branch -M main
git reset --hard origin/main
# Настроить .env в backend/, установить зависимости, один раз запустить:
# cd backend && npm install && npm run build && pm2 start ecosystem.config.js --name messager-backend
```

Дальше обновления только через `pull-and-update.sh`.

## Обычное обновление после правок

**Локально (Windows):**

```powershell
cd c:\OSPanel\domains\Messager
git add .
git commit -m "Описание изменений"
git push
```

**На сервере (SSH):**

```bash
cd /var/www/messager && bash scripts/pull-and-update.sh
```

Скрипт сделает: `git pull`, установку зависимостей (при необходимости), сборку фронта и бэка, перезапуск PM2, перезагрузку Nginx.

## Если нет доступа по SSH с ПК

Можно только пушить в Git; на сервере кто-то с доступом выполняет `pull-and-update.sh` (или настроить cron/CI по расписанию).

## Откат на сервере

```bash
cd /var/www/messager
git log --oneline -5   # посмотреть коммиты
git checkout <hash>    # или git reset --hard origin/main
bash scripts/update-on-server.sh
```

## Альтернатива: деплой без Git (как раньше)

Если нужно гнать код напрямую с ПК на сервер:

```powershell
.\scripts\deploy-update.ps1
```

Тогда синхронизация идёт через rsync/scp, затем на сервере можно вызвать `scripts/update-on-server.sh` (или это уже делает скрипт по SSH).
