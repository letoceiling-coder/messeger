# БЫСТРОЕ РАЗВЕРТЫВАНИЕ НА СЕРВЕР DRAGON

## 🚀 БЫСТРЫЙ СТАРТ

### 1. Настройка SSH (первый раз)

```bash
# Настройка SSH config
chmod +x scripts/setup-ssh-config.sh
./scripts/setup-ssh-config.sh

# Или вручную добавить в ~/.ssh/config:
# Host dragon
#     HostName dragon
#     User dsc23ytp
#     IdentityFile ~/.ssh/id_rsa
```

### 2. Проверка подключения

```bash
ssh dragon
# Должно подключиться без пароля (если ключи настроены)
```

### 3. Создание структуры на сервере

```bash
ssh dragon "mkdir -p ~/messager/{backend,frontend-web,mobile,nginx}"
```

### 4. Синхронизация файлов

```bash
# Сделать скрипты исполняемыми (Linux/Mac)
chmod +x scripts/*.sh

# Синхронизация
./scripts/sync-to-server.sh
```

### 5. Настройка на сервере

```bash
# Подключиться к серверу
ssh dragon

# Backend
cd ~/messager/backend
cp .env.production.example .env.production
nano .env.production  # Заполнить значения
npm install --production
npx prisma generate
npx prisma migrate deploy
npm run build
mkdir -p uploads/audio logs

# Frontend
cd ../frontend-web
cp .env.production.example .env.production
nano .env.production  # Заполнить значения
npm install
npm run build
cp -r dist/* ~/parser-auto.site-access.ru/public_html/
```

### 6. Запуск Backend

```bash
# На сервере
cd ~/messager/backend

# Вариант 1: PM2 (рекомендуется)
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Вариант 2: systemd
sudo nano /etc/systemd/system/messager-backend.service
# (см. DEPLOYMENT_BEGET.md для конфигурации)
sudo systemctl enable messager-backend
sudo systemctl start messager-backend
```

---

## 📋 АВТОМАТИЧЕСКОЕ РАЗВЕРТЫВАНИЕ

### Полное развертывание одной командой

```bash
./scripts/deploy-to-server.sh
```

Этот скрипт:
1. Синхронизирует файлы
2. Устанавливает зависимости
3. Выполняет миграции
4. Собирает проекты
5. Размещает Frontend
6. Перезапускает Backend

---

## 🔄 ОБНОВЛЕНИЕ ПРОЕКТА

### Быстрое обновление

```bash
# Синхронизация изменений
./scripts/sync-to-server.sh

# На сервере
ssh dragon
cd ~/messager/backend
npm run build
pm2 restart messager-backend

cd ../frontend-web
npm run build
cp -r dist/* ~/parser-auto.site-access.ru/public_html/
```

### Или автоматически

```bash
./scripts/deploy-to-server.sh
```

---

## 💻 РАБОТА НАПРЯМУЮ С СЕРВЕРОМ

### VS Code Remote SSH

1. Установите расширение "Remote - SSH"
2. F1 → "Remote-SSH: Connect to Host"
3. Выберите "dragon"
4. Откройте папку: `/home/dsc23ytp/messager`

Теперь VS Code работает напрямую с файлами на сервере!

### SSH туннель для БД

```bash
# В отдельном терминале
ssh -L 5432:localhost:5432 dragon

# Теперь можно подключаться к БД через localhost:5432
```

---

## ✅ ПРОВЕРКА

### Backend

```bash
ssh dragon "curl http://localhost:3000/health"
```

### Frontend

Откройте: `https://parser-auto.site-access.ru`

### PM2

```bash
ssh dragon "pm2 status"
ssh dragon "pm2 logs messager-backend"
```

---

## 📝 ВАЖНЫЕ ПУТИ

- **Проект:** `~/messager`
- **Backend:** `~/messager/backend`
- **Frontend:** `~/messager/frontend-web`
- **Public HTML:** `~/parser-auto.site-access.ru/public_html`
- **Логи:** `~/messager/backend/logs`

---

## 🔧 АЛИАСЫ (ОПЦИОНАЛЬНО)

Добавьте в `~/.bashrc` или `~/.zshrc`:

```bash
alias messager-ssh='ssh dragon'
alias messager-sync='./scripts/sync-to-server.sh'
alias messager-deploy='./scripts/deploy-to-server.sh'
```

Затем:
```bash
source ~/.bashrc
```

Теперь можно использовать:
- `messager-ssh` - подключиться к серверу
- `messager-sync` - синхронизировать файлы
- `messager-deploy` - развернуть проект

---

## 🆘 ПРОБЛЕМЫ?

### Не подключается SSH

```bash
# Проверка
ssh -v dragon

# Настройка ключей
ssh-copy-id dsc23ytp@dragon
```

### Ошибки синхронизации

```bash
# Проверка rsync
which rsync

# Установка (если нужно)
# Ubuntu/Debian: sudo apt-get install rsync
# Mac: brew install rsync
```

### Проблемы с правами

```bash
ssh dragon "chmod -R 755 ~/messager"
```

---

## 📚 ДОПОЛНИТЕЛЬНАЯ ДОКУМЕНТАЦИЯ

- `SERVER_CONFIG.md` - конфигурация сервера
- `SSH_SETUP.md` - настройка SSH
- `DEPLOYMENT_BEGET.md` - полное руководство
