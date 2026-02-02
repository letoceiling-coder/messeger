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

### Resend (обход блокировки SMTP на VPS)

Если VPS блокирует порты 25/465/587, используйте Resend (HTTP API, порт 443):

1. Зарегистрируйтесь на [resend.com](https://resend.com)
2. Создайте API‑ключ
3. Добавьте в `.env`:

```env
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_FROM=Messager <info@neeklo.ru>
```

Для теста можно использовать `onboarding@resend.dev` (письма только на email регистрации). Для продакшена проверьте домен в Resend.

## Миграция БД

Таблица `email_codes` создаётся миграцией `20260202100000_add_email_codes`.

```bash
npx prisma migrate deploy
```
