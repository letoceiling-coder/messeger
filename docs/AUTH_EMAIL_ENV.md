# Настройка авторизации: телефон и email

## Переменные окружения

### AUTH_MODE (режим авторизации)

- `both` — телефон и email (по умолчанию)
- `phone` — только телефон
- `email` — только email

```env
AUTH_MODE=both
```

### SMTP для email

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.beget.com
MAIL_PORT=587
MAIL_USERNAME=info@neeklo.ru
MAIL_PASSWORD=ваш_пароль
MAIL_FROM=info@neeklo.ru
```

### Пример для Beget

```env
MAIL_HOST=smtp.beget.com
MAIL_PORT=587
MAIL_USERNAME=info@neeklo.ru
MAIL_PASSWORD=ваш_пароль
MAIL_FROM=info@neeklo.ru
```

> Beget: при таймаутах на 465 используйте порт **587** (STARTTLS).

## Миграция БД

Таблица `email_codes` создаётся миграцией `20260202100000_add_email_codes`.

```bash
npx prisma migrate deploy
```
