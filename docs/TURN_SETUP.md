# Настройка TURN для видеозвонков

## Что уже сделано в коде

- В `frontend-web/src/services/webrtc.service.ts` функция `getIceServers()` уже подключает TURN, если заданы переменные окружения:
  - **VITE_TURN_URL** — адрес TURN (обязательно), например `turn:turn.example.com:3478`
  - **VITE_TURN_USER** — логин (если TURN с аутентификацией)
  - **VITE_TURN_CREDENTIAL** — пароль (если TURN с аутентификацией)
- STUN (Google) используется всегда; TURN добавляется в список ICE-серверов только при наличии `VITE_TURN_URL`.

Без TURN звонки часто не устанавливаются между телефоном (мобильный интернет) и ПК из‑за NAT/файрволов. С TURN релейный сервер помогает установить соединение.

---

## Что нужно сделать вам

### 1. Завести TURN-сервер

**Вариант A: свой сервер (coturn на VPS)**

- **Пошаговая инструкция:** [docs/COTURN_SETUP.md](COTURN_SETUP.md) — установка coturn на VPS, конфиг, порты, учётные данные, подключение к фронту.
- Кратко: установить [coturn](https://github.com/coturn/coturn), настроить `turnserver.conf` (порты 3478, `lt-cred-mech`, `user=логин:пароль`), открыть порты 3478 (UDP/TCP) и 49152–65535 (UDP), прописать TURN в `.env.production` фронта и пересобрать.

**Вариант B: облачный TURN**

- [Twilio](https://www.twilio.com/stun-turn), [Xirsys](https://xirsys.com/), [Metered.ca](https://www.metered.ca/tools/openrelay/) и др. дают готовый TURN (часто STUN+TURN и временные учётные данные).
- В панели сервиса возьмите: `urls` (TURN), `username`, `credential` и подставьте их в переменные ниже.

### 2. Передать TURN во frontend при сборке

Переменные **VITE_TURN_*** подхватываются **на момент сборки** (при `npm run build`). Их нужно задать там, где вы собираете фронт.

**Локально (для проверки)**

- В корне `frontend-web` создайте `.env.local` (файл в git не класть):
  ```
  VITE_TURN_URL=turn:ваш-turn:3478
  VITE_TURN_USER=ваш_логин
  VITE_TURN_CREDENTIAL=ваш_пароль
  ```
- Запустите `npm run build` и откройте собранное приложение.

**На сервере (деплой)**

- На сервере в каталоге `frontend-web` создайте файл `.env.production` (не коммитить в git, там секреты):
  ```bash
  cd /var/www/messager/frontend-web
  nano .env.production
  ```
  Вставьте (подставьте свои значения):
  ```env
  VITE_TURN_URL=turn:ваш-turn-сервер:3478
  VITE_TURN_USER=логин
  VITE_TURN_CREDENTIAL=пароль
  ```
  Файл `.env.production` добавлен в `frontend-web/.gitignore` — в репозиторий не попадёт.
  После сохранения выполните пересборку и деплой (например `bash scripts/pull-and-update.sh` или ваш скрипт); при `npm run build` Vite подхватит `.env.production`.
- При следующем деплое выполните сборку фронта как обычно (например, `npm run build` в `frontend-web`). Vite при `npm run build` сам подхватит `.env.production`.
- После сборки перезапустите/обновите то, что раздаёт статику (nginx и т.п.).

**Через CI/скрипт деплоя**

- Перед вызовом `npm run build` в `frontend-web` экспортируйте переменные или подставьте их в команду:
  ```bash
  export VITE_TURN_URL=turn:...
  export VITE_TURN_USER=...
  export VITE_TURN_CREDENTIAL=...
  cd frontend-web && npm run build
  ```

### 3. Проверка

- Соберите фронт с заданными `VITE_TURN_*`, откройте видеозвонок (желательно телефон ↔ ПК).
- В логах звонка (кнопка «Логи» в приложении) смотрите, что ICE доходит до `connected`; при проблемах часто видно `iceConnectionState: failed` до появления TURN в конфиге.

---

## Итог

| Что | Статус |
|-----|--------|
| Код: подключение TURN в WebRTC | ✅ Реализовано |
| Запущенный TURN-сервер (coturn или облако) | ⬜ Нужно настроить у вас |
| Переменные VITE_TURN_* при сборке фронта | ⬜ Нужно задать на сервере/в CI |

После настройки TURN и пересборки фронта с `VITE_TURN_*` дополнительно в коде ничего менять не требуется.
