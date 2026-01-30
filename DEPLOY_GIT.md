# Деплой через Git (рекомендуемый способ)

Репозиторий: **https://github.com/letoceiling-coder/messeger.git**

## Схема

1. **Локально:** правки кода → `git add` → `git commit` → `git push`
2. **На сервере:** `cd /var/www/messager && bash scripts/pull-and-update.sh` — подтянуть код, собрать, перезапустить.

**Быстрый деплой с ПК одной командой (без ручного SSH):**
```powershell
.\scripts\deploy-git.ps1
```
Скрипт делает `git push` и по SSH запускает на сервере `pull-and-update.sh`. Быстрее, чем rsync/scp: передаются только дельты (git), а на сервере при неизменённых зависимостях пропускается `npm install`.

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

**Оптимизация скорости:** `pull-and-update.sh` использует `npm ci` (быстрее, чем `npm install`) и **пропускает** `npm install` для фронта и бэка, если не менялись `package.json` и `package-lock.json` — так повторные деплои без смены зависимостей идут быстрее.

## Если нет доступа по SSH с ПК

Можно только пушить в Git; на сервере кто-то с доступом выполняет `pull-and-update.sh` (или настроить cron/CI по расписанию).

## Откат на сервере

```bash
cd /var/www/messager
git log --oneline -5   # посмотреть коммиты
git checkout <hash>    # или git reset --hard origin/main
bash scripts/update-on-server.sh
```

## Устранение неполадок: 502 Bad Gateway и WebSocket failed

Если после деплоя появляются **502 Bad Gateway** на `/api/auth/login` (или других `/api/*`) и **WebSocket connection failed** — Nginx не может достучаться до бэкенда на `localhost:30000`. Обычно это значит, что процесс Node (PM2) не запущен или упал.

**На сервере по SSH выполните:**

```bash
# 1. Проверить, запущен ли бэкенд
pm2 status

# 2. Если messager-backend в статусе stopped/errored — посмотреть логи
pm2 logs messager-backend --lines 50

# 3. Перезапустить (из корня проекта)
cd /var/www/messager/backend
pm2 restart messager-backend --update-env

# Если процесса нет — запустить впервые
pm2 start ecosystem.config.js --name messager-backend
pm2 save
```

**Проверка без браузера:** откройте в браузере или curl:

- `http://89.169.39.244/api/health` — должен вернуть JSON `{"status":"ok", ...}`. Если 502 — бэкенд не слушает порт 30000.

**Частые причины падения бэкенда:**

- Нет или неверный `backend/.env.production` (DATABASE_URL, JWT_SECRET и т.д.)
- Ошибка при сборке: в `backend/dist/src/` нет `main.js` — на сервере выполнить `cd backend && npm run build`
- Нехватка памяти — проверить `pm2 logs` на ошибки

После исправления снова выполните на сервере: `cd /var/www/messager && bash scripts/update-on-server.sh` (или только перезапуск PM2, если код не менялся).

---

## Подготовка сервера для тестов

Чтобы на сервере можно было обновлять код и запускать тесты, нужно один раз подготовить окружение.

### Что должно быть установлено на сервере

| Компонент | Назначение |
|-----------|------------|
| **Node.js** (LTS, например 18 или 20) | Запуск бэкенда и сборка фронта |
| **npm** | Установка зависимостей, запуск скриптов |
| **Git** | Подтягивание кода из репозитория |
| **PM2** (глобально: `npm i -g pm2`) | Запуск и перезапуск бэкенда |
| **Nginx** (по желанию) | Прокси и раздача статики |

Проверка:

```bash
node -v   # v18.x или v20.x
npm -v
git --version
pm2 -v
```

### Запуск тестов на сервере

- **Только тесты** (без обновления кода и перезапуска):
  ```bash
  cd /var/www/messager && bash scripts/run-tests-on-server.sh
  ```
  Запускаются unit-тесты бэкенда (Jest). Для тестов **не нужна** база данных и `.env.production`.

- **Обновление кода с проверкой тестами** (деплой только если тесты прошли):
  ```bash
  cd /var/www/messager && bash scripts/pull-update-and-test.sh
  ```
  Делает: `git pull` → сборка фронта и бэка → `npm test` в backend → при успехе: перезапуск PM2 и перезагрузка Nginx.

- **Обновление без тестов** (как раньше):
  ```bash
  cd /var/www/messager && bash scripts/pull-and-update.sh
  ```

### Первый раз после клона на сервере

```bash
cd /var/www/messager
# Уже есть клон или скопирован проект — тогда:
git fetch origin
git branch -M main
git reset --hard origin/main

cd backend && npm install && cd ..
cd frontend-web && npm install && cd ..

# Проверить, что тесты проходят
bash scripts/run-tests-on-server.sh

# Настроить backend/.env.production и запустить приложение
cd backend && npm run build && pm2 start ecosystem.config.js --name messager-backend
pm2 save
```

Дальше для обновления с тестами используйте `pull-update-and-test.sh`, без тестов — `pull-and-update.sh`.

---

## Альтернатива: деплой без Git (как раньше)

Если нужно гнать код напрямую с ПК на сервер:

```powershell
.\scripts\deploy-update.ps1
```

Тогда синхронизация идёт через rsync/scp, затем на сервере можно вызвать `scripts/update-on-server.sh` (или это уже делает скрипт по SSH).
