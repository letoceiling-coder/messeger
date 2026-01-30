# НАСТРОЙКА SSH ДЛЯ WINDOWS

## БЫСТРЫЙ СТАРТ

### 1. Установка OpenSSH (если не установлен)

```powershell
# Проверка
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH*'

# Установка (если нужно)
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

### 2. Настройка SSH ключей

```powershell
# Генерация ключа (если еще нет)
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
# Нажать Enter для всех вопросов

# Копирование ключа на сервер
type $env:USERPROFILE\.ssh\id_rsa.pub | ssh dsc23ytp@dragon "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### 3. Настройка SSH config

Создайте файл `C:\Users\YourUsername\.ssh\config`:

```
Host dragon
    HostName dragon
    User dsc23ytp
    IdentityFile C:\Users\YourUsername\.ssh\id_rsa
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

### 4. Проверка подключения

```powershell
ssh dragon
# Должно подключиться без пароля
```

---

## АЛЬТЕРНАТИВЫ ДЛЯ WINDOWS

### Вариант 1: Git Bash (рекомендуется)

1. Установите Git for Windows (включает Git Bash)
2. Используйте bash скрипты из `scripts/`

```bash
# В Git Bash
cd /c/OSPanel/domains/Messager
chmod +x scripts/*.sh
./scripts/sync-to-server.sh
```

### Вариант 2: WSL (Windows Subsystem for Linux)

```powershell
# Установка WSL
wsl --install

# После установки, в WSL:
cd /mnt/c/OSPanel/domains/Messager
chmod +x scripts/*.sh
./scripts/sync-to-server.sh
```

### Вариант 3: PowerShell скрипты

Используйте PowerShell скрипты из `scripts/*.ps1`:

```powershell
# Синхронизация
.\scripts\sync-to-server.ps1
```

---

## VS CODE REMOTE SSH

### Установка

1. Откройте VS Code
2. Установите расширение "Remote - SSH"
3. F1 → "Remote-SSH: Connect to Host"
4. Выберите "dragon" или введите: `dsc23ytp@dragon`

### Работа с файлами

После подключения VS Code будет работать напрямую с файлами на сервере.

---

## СИНХРОНИЗАЦИЯ ФАЙЛОВ

### PowerShell скрипт

```powershell
.\scripts\sync-to-server.ps1
```

### Git Bash

```bash
./scripts/sync-to-server.sh
```

### WSL

```bash
./scripts/sync-to-server.sh
```

---

## РУЧНАЯ СИНХРОНИЗАЦИЯ

### Через scp

```powershell
# Backend
scp -r backend/* dragon:~/messager/backend/

# Frontend
scp -r frontend-web/* dragon:~/messager/frontend-web/
```

### Через SFTP клиент

- **WinSCP** (рекомендуется для Windows)
- **FileZilla**
- **Cyberduck**

---

## РЕШЕНИЕ ПРОБЛЕМ

### Проблема с путями в PowerShell

PowerShell использует обратные слеши. Для SSH используйте прямые:

```powershell
# Правильно
ssh dragon "cd ~/messager"

# Неправильно
ssh dragon "cd ~\messager"
```

### Проблема с правами на скрипты

```powershell
# Разрешить выполнение
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Проблема с SSH ключами

```powershell
# Проверка ключей
ssh-add -l

# Добавление ключа
ssh-add $env:USERPROFILE\.ssh\id_rsa
```

---

## РЕКОМЕНДАЦИИ

1. **Используйте Git Bash** для bash скриптов
2. **Используйте VS Code Remote SSH** для работы напрямую с сервером
3. **Настройте SSH ключи** для безопасности
4. **Используйте rsync** через WSL или Git Bash для быстрой синхронизации

---

## БЫСТРЫЕ КОМАНДЫ

```powershell
# Подключение
ssh dragon

# Синхронизация (PowerShell)
.\scripts\sync-to-server.ps1

# Синхронизация (Git Bash)
./scripts/sync-to-server.sh

# Работа на сервере
ssh dragon "cd ~/messager/backend && ls -la"
```
