# ⚡ БЫСТРЫЕ КОМАНДЫ ДЛЯ УПРАВЛЕНИЯ TURN

## 🔍 Проверка текущего состояния

### Какой TURN сейчас используется?
```powershell
ssh root@89.169.39.244 "cat /var/www/messager/frontend-web/.env.production"
```

### Статус coturn
```powershell
ssh root@89.169.39.244 "systemctl status coturn --no-pager"
```

### Открыт ли порт 3478?
```powershell
Test-NetConnection -ComputerName 89.169.39.244 -Port 3478
```

### Логи coturn (последние 50 строк)
```powershell
ssh root@89.169.39.244 "tail -50 /var/log/turnserver/turnserver.log"
```

### Логи coturn в реальном времени
```powershell
ssh root@89.169.39.244 "tail -f /var/log/turnserver/turnserver.log"
# Нажмите Ctrl+C чтобы остановить
```

---

## 🔵 Переключение на СОБСТВЕННЫЙ TURN

### Полная команда (один запуск):
```powershell
ssh root@89.169.39.244 @"
cat > /var/www/messager/frontend-web/.env.production << 'EOF'
VITE_TURN_USER=turn_fdf8b6e8
VITE_TURN_CREDENTIAL=U1cM4fhoxxqTnbb8XE9n
VITE_TURN_SERVER=89.169.39.244
EOF
cd /var/www/messager/frontend-web && npm run build
"@
```

### Пошагово:
```powershell
# 1. Подключиться
ssh root@89.169.39.244

# 2. Создать конфигурацию
cat > /var/www/messager/frontend-web/.env.production << 'EOF'
VITE_TURN_USER=turn_fdf8b6e8
VITE_TURN_CREDENTIAL=U1cM4fhoxxqTnbb8XE9n
VITE_TURN_SERVER=89.169.39.244
EOF

# 3. Пересобрать
cd /var/www/messager/frontend-web
npm run build

# 4. Выйти
exit
```

---

## 🌐 Переключение на METERED.CA (облачный)

### Быстрое восстановление из бэкапа:
```powershell
ssh root@89.169.39.244 "cp /var/www/messager/frontend-web/.env.production.metered.backup /var/www/messager/frontend-web/.env.production && cd /var/www/messager/frontend-web && npm run build"
```

### Или создать заново:
```powershell
ssh root@89.169.39.244 @"
cat > /var/www/messager/frontend-web/.env.production << 'EOF'
VITE_TURN_USER=77f6dd0527ac33be2f81633f
VITE_TURN_CREDENTIAL=f8VrDZhPIgII74E6
VITE_TURN_SERVER=global.relay.metered.ca
EOF
cd /var/www/messager/frontend-web && npm run build
"@
```

---

## 🔧 Управление coturn

### Перезапуск coturn
```powershell
ssh root@89.169.39.244 "systemctl restart coturn && systemctl status coturn --no-pager"
```

### Остановка coturn
```powershell
ssh root@89.169.39.244 "systemctl stop coturn"
```

### Запуск coturn
```powershell
ssh root@89.169.39.244 "systemctl start coturn"
```

### Посмотреть конфигурацию coturn
```powershell
ssh root@89.169.39.244 "cat /etc/turnserver.conf | grep -v '^#' | grep -v '^$'"
```

---

## 🧪 Тестирование и диагностика

### Проверить, слушает ли coturn порт 3478
```powershell
ssh root@89.169.39.244 "ss -tulnp | grep 3478"
```

### Проверить активные соединения к TURN
```powershell
ssh root@89.169.39.244 "ss -tunp | grep 3478"
```

### Посмотреть использование ресурсов coturn
```powershell
ssh root@89.169.39.244 "ps aux | grep turnserver"
```

### Тест подключения к TURN с вашего ПК (UDP)
```powershell
# PowerShell не умеет UDP напрямую, используем сторонний инструмент или Linux
# Или просто проверяйте через логи звонков
```

### Тест подключения к TURN (TCP)
```powershell
Test-NetConnection -ComputerName 89.169.39.244 -Port 3478
Test-NetConnection -ComputerName 89.169.39.244 -Port 5349
```

---

## 🔄 Пересборка фронтенда (без изменений)

```powershell
ssh root@89.169.39.244 "cd /var/www/messager/frontend-web && npm run build"
```

---

## 📊 Мониторинг во время звонка

### Терминал 1: Логи coturn
```powershell
ssh root@89.169.39.244 "tail -f /var/log/turnserver/turnserver.log"
```

### Терминал 2: Активные соединения
```powershell
ssh root@89.169.39.244
watch -n 1 'ss -tunp | grep 3478 | wc -l'
# Показывает количество активных соединений к TURN каждую секунду
```

---

## 🆘 Аварийное восстановление

### Если что-то сломалось - вернуть облачный TURN:
```powershell
ssh root@89.169.39.244 @"
# Восстановить Metered.ca
cp /var/www/messager/frontend-web/.env.production.metered.backup /var/www/messager/frontend-web/.env.production

# Пересобрать
cd /var/www/messager/frontend-web && npm run build

echo 'Восстановлено на Metered.ca'
"@
```

### Если coturn не запускается:
```powershell
ssh root@89.169.39.244 @"
# Посмотреть ошибки
journalctl -u coturn -n 50 --no-pager

# Проверить конфигурацию
turnserver --help

# Перезапустить с выводом ошибок
systemctl restart coturn
systemctl status coturn --no-pager -l
"@
```

---

## 📞 SSH доступ

```
Сервер: 89.169.39.244
Пользователь: root
Пароль: r4w*F+jVbD2Z
```

**Подключение:**
```powershell
ssh root@89.169.39.244
# Введите пароль: r4w*F+jVbD2Z
```

---

## 📝 Учётные данные

### 🔵 Собственный TURN (89.169.39.244)
```
Адрес: 89.169.39.244
Порты: 3478 (UDP/TCP), 5349 (TLS)
Логин: turn_fdf8b6e8
Пароль: U1cM4fhoxxqTnbb8XE9n
```

### 🌐 Metered.ca (облачный)
```
Адрес: global.relay.metered.ca
Порты: 80, 443
Логин: 77f6dd0527ac33be2f81633f
Пароль: f8VrDZhPIgII74E6
```

---

## ⚡ САМЫЕ ЧАСТЫЕ КОМАНДЫ

### 1. Проверить текущий TURN
```powershell
ssh root@89.169.39.244 "cat /var/www/messager/frontend-web/.env.production"
```

### 2. Переключить на свой TURN
```powershell
ssh root@89.169.39.244 "cat > /var/www/messager/frontend-web/.env.production << 'EOF'
VITE_TURN_USER=turn_fdf8b6e8
VITE_TURN_CREDENTIAL=U1cM4fhoxxqTnbb8XE9n
VITE_TURN_SERVER=89.169.39.244
EOF
cd /var/www/messager/frontend-web && npm run build"
```

### 3. Вернуть облачный TURN
```powershell
ssh root@89.169.39.244 "cp /var/www/messager/frontend-web/.env.production.metered.backup /var/www/messager/frontend-web/.env.production && cd /var/www/messager/frontend-web && npm run build"
```

### 4. Посмотреть логи TURN
```powershell
ssh root@89.169.39.244 "tail -50 /var/log/turnserver/turnserver.log"
```

### 5. Статус coturn
```powershell
ssh root@89.169.39.244 "systemctl status coturn --no-pager"
```

---

**Используйте эти команды для быстрого управления TURN сервером!** 🚀
