# КОНФИГУРАЦИЯ ДЛЯ СЕРВЕРА DRAGON

## ИНФОРМАЦИЯ О СЕРВЕРЕ

- **Хост:** dragon
- **Пользователь:** dsc23ytp
- **SSH:** dsc23ytp@dragon
- **Путь проекта:** ~/messager
- **Public HTML:** ~/parser-auto.site-access.ru/public_html
- **Домен:** parser-auto.site-access.ru

---

## БЫСТРОЕ ПОДКЛЮЧЕНИЕ

### SSH подключение

```bash
ssh dsc23ytp@dragon
```

### Работа с проектом на сервере

```bash
ssh dsc23ytp@dragon
cd ~/messager
```

---

## СТРУКТУРА НА СЕРВЕРЕ

```
/home/dsc23ytp/
├── messager/                    # Проект
│   ├── backend/                 # Backend
│   ├── frontend-web/            # Frontend
│   ├── mobile/                  # Mobile (опционально)
│   └── nginx/                   # Nginx конфигурации
└── parser-auto.site-access.ru/
    └── public_html/             # Frontend build
```

---

## КОНФИГУРАЦИЯ BACKEND

### .env.production на сервере

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/database
JWT_SECRET=your-strong-secret-key
REDIS_URL=redis://localhost:6379
TELEGRAM_BOT_TOKEN=your_bot_token
CORS_ORIGIN=https://parser-auto.site-access.ru
```

### Путь к .env

```bash
~/messager/backend/.env.production
```

---

## КОНФИГУРАЦИЯ FRONTEND

### .env.production на сервере

```env
VITE_API_URL=https://parser-auto.site-access.ru/api
VITE_WS_URL=wss://parser-auto.site-access.ru
```

### Путь к .env

```bash
~/messager/frontend-web/.env.production
```

---

## NGINX КОНФИГУРАЦИЯ

### Путь к конфигурациям

```bash
/etc/nginx/sites-available/messager-api.conf
/etc/nginx/sites-available/messager-frontend.conf
```

### Обновление конфигураций

В файлах `nginx/messager-*.conf` замените:
- `yourdomain.com` → `parser-auto.site-access.ru`
- `api.yourdomain.com` → `parser-auto.site-access.ru` (или поддомен)

---

## КОМАНДЫ ДЛЯ РАБОТЫ

### Синхронизация файлов

```bash
./scripts/sync-to-server.sh
```

### Полное развертывание

```bash
./scripts/deploy-to-server.sh
```

### Работа напрямую на сервере

```bash
ssh dsc23ytp@dragon
cd ~/messager/backend
# Работа с файлами
```

---

## VS CODE REMOTE SSH

### Подключение

1. Установите расширение "Remote - SSH"
2. F1 → "Remote-SSH: Connect to Host"
3. Выберите "dragon" или введите: `dsc23ytp@dragon`
4. Откройте папку: `/home/dsc23ytp/messager`

### Работа с файлами

После подключения VS Code будет работать напрямую с файлами на сервере.

---

## ПРОВЕРКА РАБОТЫ

### Backend

```bash
ssh dsc23ytp@dragon "curl http://localhost:3000/health"
```

### Frontend

Откройте в браузере: `https://parser-auto.site-access.ru`

### PM2 (если установлен)

```bash
ssh dsc23ytp@dragon "pm2 status"
ssh dsc23ytp@dragon "pm2 logs messager-backend"
```

---

## ОБНОВЛЕНИЕ ПРОЕКТА

### Вариант 1: Через скрипт

```bash
./scripts/deploy-to-server.sh
```

### Вариант 2: Вручную

```bash
# Синхронизация
./scripts/sync-to-server.sh

# На сервере
ssh dsc23ytp@dragon
cd ~/messager/backend
npm install --production
npm run build
pm2 restart messager-backend

cd ../frontend-web
npm install
npm run build
cp -r dist/* ~/parser-auto.site-access.ru/public_html/
```

---

## РЕШЕНИЕ ПРОБЛЕМ

### Проблема с SSH

```bash
# Проверка подключения
ssh -v dsc23ytp@dragon

# Проверка ключей
ssh-add -l
```

### Проблема с правами

```bash
# Проверка прав на директории
ssh dsc23ytp@dragon "ls -la ~/messager"
```

### Проблема с путями

```bash
# Проверка структуры
ssh dsc23ytp@dragon "find ~/messager -type d -maxdepth 2"
```

---

## БЕЗОПАСНОСТЬ

### Защита .env файлов

```bash
ssh dsc23ytp@dragon "chmod 600 ~/messager/backend/.env.production"
```

### SSH ключи

Используйте SSH ключи вместо паролей для безопасности.

---

## МОНИТОРИНГ

### Логи Backend

```bash
ssh dsc23ytp@dragon "tail -f ~/messager/backend/logs/combined.log"
```

### PM2 мониторинг

```bash
ssh dsc23ytp@dragon "pm2 monit"
```

---

## ПОДДЕРЖКА

При проблемах:
1. Проверить подключение: `ssh dsc23ytp@dragon`
2. Проверить структуру: `ssh dsc23ytp@dragon "ls -la ~/messager"`
3. Проверить логи: `ssh dsc23ytp@dragon "pm2 logs"`
