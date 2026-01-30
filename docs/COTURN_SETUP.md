# Свой TURN: coturn на VPS — пошагово

Инструкция для установки coturn на том же VPS, где уже крутится Messager (например `89.169.39.244` или домен `neekloai.ru`). После выполнения у вас будет свой TURN для видеозвонков.

---

## Шаг 1. Подключиться к VPS и установить coturn

```bash
ssh root@89.169.39.244
# или: ssh root@ваш-сервер
```

**Ubuntu/Debian:**
```bash
apt update
apt install -y coturn
```

**CentOS/RHEL:**
```bash
yum install -y epel-release
yum install -y coturn
```

Проверка: `which turnserver` — должен вывести путь к бинарнику.

---

## Шаг 2. Включить автозапуск coturn

По умолчанию coturn может быть отключён в systemd. Включите:

```bash
# Ubuntu/Debian: раскомментировать в конфиге, что coturn слушает
sed -i 's/#TURNSERVER_ENABLED=1/TURNSERVER_ENABLED=1/' /etc/default/coturn 2>/dev/null || true

# Включить и запустить сервис
systemctl enable coturn
systemctl start coturn
```

Если в вашем дистрибутиве нет `/etc/default/coturn`, достаточно `systemctl enable coturn && systemctl start coturn`.

---

## Шаг 3. Настроить конфиг coturn

Основной конфиг: `/etc/turnserver.conf` (или `/etc/coturn/turnserver.conf` — зависит от дистрибутива).

Создайте резервную копию и отредактируйте:

```bash
cp /etc/turnserver.conf /etc/turnserver.conf.bak 2>/dev/null || true
nano /etc/turnserver.conf
```

**Минимальный рабочий набор опций** (оставьте или добавьте):

```conf
# Слушать на всех интерфейсах
listening-ip=0.0.0.0
relay-ip=0.0.0.0

# Порт TURN (стандарт)
listening-port=3478
tls-listening-port=5349

# Внешний IP вашего VPS — обязательно укажите реальный IP
external-ip=89.169.39.244

# Realm (домен/имя для аутентификации)
realm=neekloai.ru

# Долговременные учётные данные (логин/пароль)
lt-cred-mech

# Статический пользователь (логин и пароль в виде user:password)
# Замените myturnuser и MyStr0ngPass на свои значения
user=myturnuser:MyStr0ngPass

# Логи (по желанию)
log-file=/var/log/turnserver/turnserver.log
verbose
```

Важно:
- `external-ip` — замените на IP вашего VPS (у вас `89.169.39.244`). Если сервер за NAT, иногда указывают `external-ip=внутренний-ip/внешний-ip`.
- `realm` — можно оставить домен или любое имя.
- `user=логин:пароль` — придумайте логин и пароль; их потом пропишете в `VITE_TURN_USER` и `VITE_TURN_CREDENTIAL` на фронте.

Сохраните файл (в nano: Ctrl+O, Enter, Ctrl+X).

---

## Шаг 4. Создать каталог для логов (если указали log-file)

```bash
mkdir -p /var/log/turnserver
chown turnserver:turnserver /var/log/turnserver 2>/dev/null || chown nobody:nogroup /var/log/turnserver 2>/dev/null || true
```

Если в конфиге не используете `log-file`, этот шаг можно пропустить.

---

## Шаг 5. Открыть порты в файрволе

TURN использует:
- **3478** — UDP и TCP (основной порт).
- **49152–65535** — UDP (диапазон для реле; у coturn по умолчанию именно такой).

**ufw (Ubuntu):**
```bash
ufw allow 3478/udp
ufw allow 3478/tcp
ufw allow 49152:65535/udp
ufw status
ufw reload
```

**firewalld (CentOS):**
```bash
firewall-cmd --permanent --add-port=3478/udp
firewall-cmd --permanent --add-port=3478/tcp
firewall-cmd --permanent --add-port=49152-65535/udp
firewall-cmd --reload
```

Если VPS за панелью хостинга (например, отдельные правила в кабинете) — откройте те же порты там.

---

## Шаг 6. Перезапустить coturn и проверить

```bash
systemctl restart coturn
systemctl status coturn
```

Должен быть `active (running)`. Проверка порта:

```bash
ss -ulnp | grep 3478
```

Должны увидеть процесс, слушающий 3478.

---

## Шаг 7. Указать TURN во фронте (на сервере)

На том же VPS в каталоге фронта создайте `.env.production` с учётными данными из шага 3:

```bash
cd /var/www/messager/frontend-web
nano .env.production
```

Содержимое (подставьте **те же** логин и пароль, что в `user=...` в coturn):

```env
VITE_TURN_URL=turn:89.169.39.244:3478
VITE_TURN_USER=myturnuser
VITE_TURN_CREDENTIAL=MyStr0ngPass
```

Если у вас есть домен и он указывает на этот VPS, можно использовать его:

```env
VITE_TURN_URL=turn:neekloai.ru:3478
VITE_TURN_USER=myturnuser
VITE_TURN_CREDENTIAL=MyStr0ngPass
```

Сохраните. Файл в git не коммитить (уже в `.gitignore`).

---

## Шаг 8. Пересобрать фронт и задеплоить

На сервере:

```bash
cd /var/www/messager
bash scripts/pull-and-update.sh
```

Либо вручную:

```bash
cd /var/www/messager/frontend-web
npm run build
# затем перезапуск backend/nginx по вашему сценарию
```

После деплоя следующая сборка уже будет с TURN; клиенты получат конфиг при загрузке приложения.

---

## Шаг 9. Проверка видеозвонка

1. Откройте мессенджер с телефона и с ПК (желательно в разных сетях).
2. Запустите видеозвонок.
3. В интерфейсе нажмите «Логи» — в логах WebRTC должен появиться переход в `connected`; при использовании TURN часто видно `relay` в типе кандидата.

Если звонок устанавливается там, где раньше падал (телефон ↔ ПК) — TURN работает.

---

## Краткий чеклист

| Шаг | Действие |
|-----|----------|
| 1 | Установить coturn на VPS |
| 2 | Включить и запустить сервис `coturn` |
| 3 | Настроить `/etc/turnserver.conf`: listening-ip, relay-ip, external-ip, realm, lt-cred-mech, user=логин:пароль |
| 4 | При необходимости создать `/var/log/turnserver` |
| 5 | Открыть порты 3478 (UDP/TCP) и 49152–65535 (UDP) |
| 6 | Перезапустить coturn, проверить `systemctl status` и `ss -ulnp \| grep 3478` |
| 7 | Создать на сервере `frontend-web/.env.production` с VITE_TURN_URL, VITE_TURN_USER, VITE_TURN_CREDENTIAL |
| 8 | Пересобрать фронт и задеплоить |
| 9 | Проверить видеозвонок телефон ↔ ПК |

---

## Возможные проблемы

- **Звонок не устанавливается:** проверьте, что порты открыты не только в ufw/firewalld, но и в панели хостинга (если есть). Проверьте `external-ip` в конфиге — должен быть реальный внешний IP VPS.
- **Ошибка аутентификации:** логин и пароль в `.env.production` должны совпадать с `user=логин:пароль` в turnserver.conf.
- **coturn не стартует:** посмотрите `journalctl -u coturn -n 50` и путь к `log-file` в конфиге — часто видно опечатку в пути или права на каталог.

После выполнения этих шагов свой TURN будет работать; дополнительных изменений в коде не требуется.
