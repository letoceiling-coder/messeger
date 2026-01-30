# Исправление MIME типов и проблемы входа

## Проблемы
1. **MIME типы**: JavaScript модули отдавались с неправильным Content-Type
2. **Frontend .env**: Отсутствовал файл с настройками API URL

## Исправления

### 1. MIME типы в Nginx
Добавлены правильные Content-Type заголовки для JavaScript и CSS файлов:
```nginx
location ~* \.(js|mjs)$ {
    add_header Content-Type application/javascript;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location ~* \.css$ {
    add_header Content-Type text/css;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. Frontend .env файл
Создан файл `/var/www/messager/frontend-web/.env`:
```
VITE_API_URL=http://89.169.39.244/api
VITE_WS_URL=ws://89.169.39.244
```

### 3. Пересборка frontend
Frontend пересобран с правильными переменными окружения.

## Проверка
1. Откройте `http://89.169.39.244/login` в браузере
2. Страница должна загружаться без ошибок MIME типов
3. Попробуйте войти с:
   - Email: `dsc-23@yandex.ru`
   - Password: `123123123`

## Следующие шаги
Если вход не работает, проверьте логи:
```bash
ssh root@89.169.39.244 "pm2 logs messager-backend --lines 50 | grep AUTH"
```
