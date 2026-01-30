# HTTPS для parser-auto.siteaccess.ru (микрофон и камера)

Браузер даёт доступ к микрофону и камере только по **HTTPS** или localhost. Чтобы звонки и голосовые сообщения работали по домену, нужен SSL.

## Что нужно заранее

1. **Домен parser-auto.siteaccess.ru** должен указывать на IP сервера (89.169.39.244):  
   A-запись `parser-auto.siteaccess.ru` → `89.169.39.244`.
2. На сервере открыт **порт 80** (для проверки Let's Encrypt).

## Получение сертификата (один раз)

Подключитесь по SSH к серверу и выполните по шагам.

### 1) Включить конфиг «шаг 1» (без HTTPS)

Чтобы certbot мог пройти проверку по HTTP, сначала должен работать конфиг без редиректа на HTTPS:

```bash
sudo cp /var/www/messager/nginx/messager-vps-step1.conf /etc/nginx/sites-available/messager-vps.conf
sudo nginx -t && sudo systemctl reload nginx
```

### 2) Установить certbot (если ещё не установлен)

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

### 3) Получить сертификат

```bash
sudo certbot certonly --webroot \
  -w /var/www/messager/frontend-web/dist \
  -d parser-auto.siteaccess.ru \
  --email ваш@email.ru \
  --agree-tos \
  --no-eff-email
```

Сертификаты появятся в:
- `/etc/letsencrypt/live/parser-auto.siteaccess.ru/fullchain.pem`
- `/etc/letsencrypt/live/parser-auto.siteaccess.ru/privkey.pem`

### 4) Включить полный конфиг с HTTPS

После успешного получения сертификата:

```bash
sudo cp /var/www/messager/nginx/messager-vps.conf /etc/nginx/sites-available/messager-vps.conf
sudo nginx -t && sudo systemctl reload nginx
```

Удалите дубликат в conf.d, если он есть:

```bash
sudo rm -f /etc/nginx/conf.d/messager-vps.conf
```

### 5) Автопродление сертификата

Certbot обычно настраивает таймер. Проверить:

```bash
sudo systemctl status certbot.timer
```

Продление вручную:

```bash
sudo certbot renew --dry-run
```

Редирект на HTTPS в конфиге оставляет для certbot путь `/.well-known/acme-challenge/` по HTTP, так что продление будет работать.

## Итог

- Сайт по **https://parser-auto.siteaccess.ru** — микрофон и камера доступны.
- По **http://89.169.39.244** всё по-прежнему по HTTP (без медиа-устройств по домену).
- После шагов 1–4 пользователи должны открывать **https://parser-auto.siteaccess.ru** для звонков и голосовых сообщений.
