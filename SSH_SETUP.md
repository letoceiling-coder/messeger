# НАСТРОЙКА SSH ПОДКЛЮЧЕНИЯ К СЕРВЕРУ

## ИНФОРМАЦИЯ О СЕРВЕРЕ

- **Хост:** dragon
- **Пользователь:** dsc23ytp
- **Путь на сервере:** ~/parser-auto.site-access.ru/public_html
- **Полный путь:** /home/dsc23ytp/parser-auto.site-access.ru/public_html

---

## ШАГ 1: ПРОВЕРКА SSH ПОДКЛЮЧЕНИЯ

### Тест подключения

```bash
ssh dsc23ytp@dragon
```

Если подключение работает, переходите к следующему шагу.

### Если требуется настройка SSH ключей

```bash
# Генерация SSH ключа (если еще нет)
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Копирование ключа на сервер
ssh-copy-id dsc23ytp@dragon

# Или вручную
cat ~/.ssh/id_rsa.pub | ssh dsc23ytp@dragon "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

---

## ШАГ 2: НАСТРОЙКА SSH CONFIG

Создайте/отредактируйте файл `~/.ssh/config`:

```ssh-config
Host dragon
    HostName dragon
    User dsc23ytp
    IdentityFile ~/.ssh/id_rsa
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

Теперь можно подключаться просто:
```bash
ssh dragon
```

---

## ШАГ 3: СОЗДАНИЕ СТРУКТУРЫ НА СЕРВЕРЕ

```bash
ssh dragon "mkdir -p ~/messager/{backend,frontend-web,mobile}"
```

---

## ШАГ 4: СИНХРОНИЗАЦИЯ ФАЙЛОВ

Используйте скрипты из `scripts/sync-to-server.sh` или `scripts/deploy-to-server.sh`

---

## ШАГ 5: VS CODE REMOTE SSH (ОПЦИОНАЛЬНО)

### Установка расширения

1. Откройте VS Code
2. Установите расширение "Remote - SSH"
3. Нажмите F1 → "Remote-SSH: Connect to Host"
4. Выберите "dragon" (из config)

### Работа напрямую с сервером

После подключения VS Code будет работать напрямую с файлами на сервере.

---

## АЛЬТЕРНАТИВЫ

### rsync для синхронизации

```bash
# Синхронизация Backend
rsync -avz --exclude 'node_modules' --exclude '.git' \
  backend/ dragon:~/messager/backend/

# Синхронизация Frontend
rsync -avz --exclude 'node_modules' --exclude '.git' \
  frontend-web/ dragon:~/messager/frontend-web/
```

### SFTP клиенты

- FileZilla
- WinSCP (Windows)
- Cyberduck

---

## ПРОВЕРКА ПОДКЛЮЧЕНИЯ

```bash
# Проверка SSH
ssh dragon "echo 'SSH работает!'"

# Проверка структуры
ssh dragon "ls -la ~/messager/"

# Проверка Node.js на сервере
ssh dragon "node --version"
```
