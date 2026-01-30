# НАСТРОЙКА APACHE НА BEGET

## ⚠️ ВАЖНО

На вашем сервере работает **Apache**, а не Nginx! Нужно настроить проксирование через `.htaccess`.

---

## ✅ ЧТО УЖЕ СДЕЛАНО

Файл `.htaccess` создан и скопирован на сервер:
- Путь: `~/parser-auto.site-access.ru/public_html/.htaccess`
- Содержит настройки для проксирования API

---

## ⚙️ ЧТО НУЖНО СДЕЛАТЬ

### 1. Проверить модули Apache

На Beget должны быть включены модули:
- `mod_proxy`
- `mod_proxy_http`
- `mod_rewrite`

**Если модули не включены** - обратитесь в поддержку Beget.

### 2. Проверить файл .htaccess

```bash
ssh dsc23ytp@5.101.156.207
cat ~/parser-auto.site-access.ru/public_html/.htaccess
```

Убедитесь, что файл содержит правильную конфигурацию.

### 3. Проверить работу

Через 1-2 минуты:

```bash
curl https://parser-auto.siteaccess.ru/api/health
```

Должен вернуть: `{"status":"ok"}`

---

## 🔧 ЕСЛИ НЕ РАБОТАЕТ

### Вариант 1: Обратиться в поддержку Beget

1. Зайдите в панель: `https://cp.beget.com`
2. Откройте **"Поддержка"**
3. Напишите:

```
Здравствуйте!

Нужна помощь с настройкой Apache для проксирования API.

Сайт: parser-auto.siteaccess.ru
Backend работает на: http://localhost:3000

Нужно:
1. Включить модули: mod_proxy, mod_proxy_http, mod_rewrite
2. Настроить проксирование:
   - /api → http://localhost:3000/api
   - /socket.io → http://localhost:3000/socket.io

Файл .htaccess уже создан в public_html/, но проксирование не работает.

Помогите, пожалуйста, настроить.
```

### Вариант 2: Использовать поддомен для API

1. В панели Beget создайте поддомен: `api.parser-auto.siteaccess.ru`
2. Настройте его на порт 3000
3. Обновите `VITE_API_URL` во Frontend

---

## 📋 СОДЕРЖИМОЕ ФАЙЛА .htaccess

Файл содержит:

```apache
<IfModule mod_proxy.c>
    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api
    
    ProxyPass /socket.io http://localhost:3000/socket.io
    ProxyPassReverse /socket.io http://localhost:3000/socket.io
    
    ProxyPreserveHost On
    ProxyRequests Off
</IfModule>

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/api
    RewriteCond %{REQUEST_URI} !^/socket.io
    RewriteRule . /index.html [L]
</IfModule>
```

---

## ✅ ГОТОВО!

Файл `.htaccess` создан! Если модули Apache включены, проксирование должно работать.

**Проверка:**
```bash
curl https://parser-auto.siteaccess.ru/api/health
```

Должен вернуть: `{"status":"ok"}`
