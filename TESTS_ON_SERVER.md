# Тесты на сервере

Подробности — в [DEPLOY_GIT.md](DEPLOY_GIT.md) (раздел «Подготовка сервера для тестов»).

## Что подготовить на сервере

- **Node.js** (LTS 18 или 20), **npm**, **Git**, **PM2** (`npm i -g pm2`).
- Репозиторий в `/var/www/messager`, зависимости установлены (`npm install` в `backend/` и `frontend-web/`).

## Команды на сервере (SSH)

| Действие | Команда |
|----------|--------|
| Только запустить тесты | `cd /var/www/messager && bash scripts/run-tests-on-server.sh` |
| Обновить код, собрать, запустить тесты, при успехе — перезапустить приложение | `cd /var/www/messager && bash scripts/pull-update-and-test.sh` |
| Обновить код без тестов (как раньше) | `cd /var/www/messager && bash scripts/pull-and-update.sh` |

Для unit-тестов бэкенда **не нужны** база данных и `.env.production`.
