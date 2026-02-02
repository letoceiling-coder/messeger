# Деплой (сборка → Git → обновление на сервере)

## Локально: одна команда

Из корня проекта (**messendger-dising-2**) или из папки **chat-hub**:

```bash
npm run deploy
```

(Из корня команда передаётся в chat-hub и там выполняется сборка, коммит, push и вызов webhook.)

Скрипт по порядку:

1. **Сборка** — `deploy:local` (восстановление `index.html`, `npm run build`, копирование `dist/` в корень).
2. **Git** — `git add -A`, `git commit`, `git push origin main`.
3. **Webhook** — GET-запрос на `DEPLOY_WEBHOOK_URL`, если переменная задана.

Сообщение коммита по умолчанию — текущая дата/время. Своё сообщение:

```bash
npm run deploy -- "Исправлена вёрстка голосовых сообщений"
```

### Включение обновления на сервере по запросу

URL webhook задаётся в файле **`.env.deploy`** (в корне проекта, не коммитится). Если файл есть, `npm run deploy` сам подхватит `DEPLOY_WEBHOOK_URL` и вызовет сервер после push.

Токен для webhook сгенерирован и записан в **`scripts/SERVER_DEPLOY_TOKEN.txt`** (не коммитится). Тот же токен нужно указать на сервере в `deploy.php` (см. ниже).

Ручная установка переменной (если нет `.env.deploy`):

```bash
# Windows (PowerShell)
$env:DEPLOY_WEBHOOK_URL="https://post-ads.ru/deploy.php?token=YOUR_SECRET"; npm run deploy

# Linux / macOS
DEPLOY_WEBHOOK_URL=https://post-ads.ru/deploy.php?token=YOUR_SECRET npm run deploy
```

---

## Пошаговая настройка сервера (один раз)

Чтобы с локального компьютера команда `npm run deploy` обновляла код на сервере, на сервере нужно сделать следующее **один раз**. Подключайтесь по SSH под пользователем, у которого есть доступ к репозиторию (например, `dsc23ytp`).

| Шаг | Действие |
|-----|----------|
| **1** | Подключиться по SSH к серверу. |
| **2** | Перейти в корень проекта: `cd ~/stroy/public_html` (или ваш путь, где лежит `index.html`, `scripts/`). |
| **3** | Убедиться, что в проекте есть файлы из репозитория: `scripts/deploy-webhook.php.example`, `scripts/server-pull-and-deploy.sh`, `scripts/cron-deploy-check.sh`. Если нет — выполнить `git pull origin main`. |
| **4** | Создать webhook: скопировать пример в корень проекта.<br>`cp scripts/deploy-webhook.php.example deploy.php` |
| **5** | Открыть `deploy.php` в редакторе и заменить `CHANGE_ME` на ваш секретный токен (тот же, что в локальном `.env.deploy` и в `scripts/SERVER_DEPLOY_TOKEN.txt`). Сохранить файл. |
| **6** | Сделать скрипты исполняемыми:<br>`chmod +x scripts/server-pull-and-deploy.sh scripts/cron-deploy-check.sh` |
| **7** | Настроить запуск скрипта раз в минуту (см. ниже **«Если crontab недоступен»**). |
| **8** | Проверить: в браузере открыть<br>`https://post-ads.ru/deploy.php?token=ВАШ_ТОКЕН&mode=cron`<br>Должен вернуться ответ с текстом `DEPLOY_QUEUED`. |

После этого при запуске **локально** команды `npm run deploy` (с настроенным `.env.deploy` и URL с `&mode=cron`) сервер в течение минуты подтянет код из git и пересоберёт проект.

### Если на сервере «crontab: command not found»

На shared-хостинге часто нет доступа к `crontab`. Варианты:

**Вариант А — Cron через панель хостинга**  
Если есть панель (cPanel, Plesk, ISPmanager и т.п.), откройте раздел **«Планировщик задач» / «Cron Jobs»** и добавьте задачу с интервалом **каждую минуту** и командой:
```bash
cd /home/d/dsc23ytp/stroy/public_html && bash scripts/cron-deploy-check.sh >> /tmp/deploy.log 2>&1
```
(путь замените на свой; часто в панели указывают только команду, а каталог задаётся отдельно или в самой команде.)

**Вариант Б — Без cron: обновление вручную по SSH**  
Cron не настраивать. После каждого `npm run deploy` локально подключайтесь по SSH к серверу и выполняйте:
```bash
cd ~/stroy/public_html && bash scripts/server-pull-and-deploy.sh
```
Тогда webhook с `&mode=cron` можно не вызывать (или вызывать — флаг создастся, но обрабатывать его будет некому; для проверки URL ответ будет `DEPLOY_QUEUED`, но обновление не произойдёт, пока вы не запустите скрипт вручную).

---

## На сервере (post-ads.ru)

**Важно:** на сервере нет sudo. Обновление по webhook возможно только через **режим cron**; прямой запуск скрипта из PHP даёт ошибку «dubious ownership» у git.

### 1. Скрипт обновления

В корне проекта на сервере уже есть `scripts/server-pull-and-deploy.sh`. Запуск вручную:

```bash
cd ~/stroy/public_html   # или ваш путь к проекту
bash scripts/server-pull-and-deploy.sh
```

Скрипт выполняет: `git pull origin main`, `npm install`, `npm run deploy:local`.

### 2. Webhook (обновление по запросу с локальной машины)

1. Скопируйте пример PHP на сервер:
   - из репозитория: `scripts/deploy-webhook.php.example`
   - на сервер: в корень проекта как `deploy.php` (или в подпапку, тогда измените URL).

2. Откройте `deploy.php` и задайте:
   - **`$secretToken`** — токен из файла **`scripts/SERVER_DEPLOY_TOKEN.txt`** (локально, тот же что в `.env.deploy`).
   - **`$projectRoot`** — путь к корню проекта на сервере (если `deploy.php` в корне сайта, оставьте `__DIR__`).

3. Выдайте права на выполнение скрипту:
   ```bash
   chmod +x scripts/server-pull-and-deploy.sh
   ```

4. Проверка в браузере или curl:
   ```bash
   curl "https://post-ads.ru/deploy.php?token=YOUR_SECRET"
   ```

5. На этом сервере **всегда используйте режим cron** (п. 6): прямой вызов скрипта из PHP не работает из‑за отсутствия sudo.

6. **Режим cron (обязателен, т.к. на сервере нет sudo):** webhook только создаёт флаг; обновление выполняет cron под вашим пользователем.
   - В **`.env.deploy`** (локально) укажите URL с **`&mode=cron`**:
     ```
     DEPLOY_WEBHOOK_URL=https://post-ads.ru/deploy.php?token=YOUR_SECRET&mode=cron
     ```
   - На сервере настройте cron (один раз):
     ```bash
     crontab -e
     ```
     Добавьте строку (подставьте свой путь):
     ```
     * * * * * cd /home/d/dsc23ytp/stroy/public_html && bash scripts/cron-deploy-check.sh >> /tmp/deploy.log 2>&1
     ```
   - Выдайте права: `chmod +x scripts/cron-deploy-check.sh`
   - При вызове webhook с `mode=cron` сервер вернёт `DEPLOY_QUEUED`; обновление выполнится в течение минуты.

После этого при запуске `npm run deploy` с заданным `DEPLOY_WEBHOOK_URL` сервер будет автоматически подтягивать код из git и пересобирать проект.
