# НАСТРОЙКА NGINX НА BEGET

## ⚠️ ВАЖНО

На Beget нет доступа к sudo, поэтому Nginx настраивается через **панель управления**.

---

## 📋 ИНСТРУКЦИЯ

### 1. Настройка через панель Beget

1. Зайдите в панель управления: `https://cp.beget.com`
2. Откройте раздел **"Сайты"**
3. Найдите сайт `parser-auto.siteaccess.ru`
4. Нажмите на иконку настроек (шестеренка) или "Управление"

### 2. Настройка Nginx конфигурации

В панели Beget должна быть возможность редактировать конфигурацию Nginx.

**Добавьте в конфигурацию:**

```nginx
# Backend API
location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# WebSocket
location /socket.io/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
}

# Загрузка файлов
location /uploads/ {
    alias /home/dsc23ytp/messager/backend/uploads/;
    expires 1y;
    add_header Cache-Control "public";
}
```

### 3. Альтернатива: через .htaccess (если Nginx недоступен)

Если нет доступа к Nginx, можно использовать `.htaccess` для Apache:

```apache
# В файле ~/parser-auto.site-access.ru/public_html/.htaccess

# API проксирование (требует mod_proxy)
<IfModule mod_proxy.c>
    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api
</IfModule>
```

---

## 🔍 ПРОВЕРКА

После настройки проверьте:

```bash
# API должен отвечать
curl https://parser-auto.siteaccess.ru/api/health

# Frontend должен открываться
# Откройте: https://parser-auto.siteaccess.ru/
```

---

## 📞 ЕСЛИ НЕ РАБОТАЕТ

1. **Обратитесь в поддержку Beget** - они помогут настроить проксирование
2. **Или используйте отдельный поддомен** для API через панель

---

## ✅ ГОТОВО!

После настройки Nginx проект будет полностью работать!
