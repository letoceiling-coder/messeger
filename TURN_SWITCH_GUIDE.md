# Инструкция по переключению TURN серверов

## ✅ Что было сделано (31.01.2026)

### 1. Обновлён код `webrtc.service.ts`
Убрана жёсткая привязка к Metered.ca, добавлена поддержка **собственного TURN сервера**.

### 2. Новые переменные окружения:
```env
VITE_TURN_USER=логин          # Логин от TURN
VITE_TURN_CREDENTIAL=пароль   # Пароль от TURN
VITE_TURN_SERVER=адрес        # Адрес TURN сервера (опционально, по умолчанию 89.169.39.244)
```

### 3. Сохранены настройки для быстрого переключения

---

## 🔄 Как переключаться между TURN серверами

### Вариант A: Собственный TURN (coturn на VPS)

**На сервере:**
```bash
cat > /var/www/messager/frontend-web/.env.production << 'EOF'
VITE_TURN_USER=turn_fdf8b6e8
VITE_TURN_CREDENTIAL=U1cM4fhoxxqTnbb8XE9n
VITE_TURN_SERVER=89.169.39.244
EOF

cd /var/www/messager/frontend-web
npm run build
```

**Локально (.env.local):**
```env
VITE_TURN_USER=turn_fdf8b6e8
VITE_TURN_CREDENTIAL=U1cM4fhoxxqTnbb8XE9n
VITE_TURN_SERVER=89.169.39.244
```

---

### Вариант B: Облачный TURN (Metered.ca)

**На сервере:**
```bash
cp /var/www/messager/frontend-web/.env.production.metered.backup /var/www/messager/frontend-web/.env.production

# ИЛИ создать заново:
cat > /var/www/messager/frontend-web/.env.production << 'EOF'
VITE_TURN_USER=77f6dd0527ac33be2f81633f
VITE_TURN_CREDENTIAL=f8VrDZhPIgII74E6
VITE_TURN_SERVER=global.relay.metered.ca
EOF

cd /var/www/messager/frontend-web
npm run build
```

**Локально (.env.local):**
```env
VITE_TURN_USER=77f6dd0527ac33be2f81633f
VITE_TURN_CREDENTIAL=f8VrDZhPIgII74E6
VITE_TURN_SERVER=global.relay.metered.ca
```

**НО!** Для Metered.ca нужно вернуть старый код с жёсткими адресами, так как у них несколько портов (80, 443).

---

## 📋 Учётные данные TURN

### 🔵 Собственный сервер (89.169.39.244):
```
Логин: turn_fdf8b6e8
Пароль: U1cM4fhoxxqTnbb8XE9n
Порты: 3478 (UDP/TCP), 5349 (TLS)
```

### 🌐 Metered.ca:
```
Логин: 77f6dd0527ac33be2f81633f
Пароль: f8VrDZhPIgII74E6
Адреса: global.relay.metered.ca, stun.relay.metered.ca
Порты: 80, 443
```

---

## 🧪 Тестирование

### После переключения:
1. Очистить кэш браузера (Ctrl+Shift+Delete)
2. Перезагрузить страницу (Ctrl+F5)
3. Совершить видеозвонок
4. Открыть "Логи" в интерфейсе звонка
5. Проверить строку: `ICE servers: Custom TURN ...` или `ICE servers: Metered ...`
6. Проверить `iceConnectionState: connected`

### Команды для проверки на сервере:
```bash
# Статус coturn
systemctl status coturn

# Открыт ли порт 3478
ss -tulnp | grep 3478

# Логи coturn
tail -f /var/log/turnserver/turnserver.log

# Текущие настройки фронтенда
cat /var/www/messager/frontend-web/.env.production
```

---

## 🐛 Отладка проблем

### Если звонки не работают:

1. **Проверить логи WebRTC** в интерфейсе (кнопка "Логи")
2. **Проверить состояние соединения:**
   - `iceConnectionState` должен дойти до `connected`
   - Если застрял в `checking` или `failed` - проблема с TURN

3. **Проверить, какой TURN используется:**
   ```javascript
   // В консоли браузера
   console.log(import.meta.env.VITE_TURN_USER);
   console.log(import.meta.env.VITE_TURN_SERVER);
   ```

4. **Проверить доступность TURN извне:**
   ```bash
   # С другого компьютера
   nc -zvu 89.169.39.244 3478  # UDP
   nc -zv 89.169.39.244 3478   # TCP
   ```

---

## ⚡ Быстрое переключение через SSH

```bash
# Переключиться на собственный TURN
ssh root@89.169.39.244 "cat > /var/www/messager/frontend-web/.env.production << 'EOF'
VITE_TURN_USER=turn_fdf8b6e8
VITE_TURN_CREDENTIAL=U1cM4fhoxxqTnbb8XE9n
VITE_TURN_SERVER=89.169.39.244
EOF
cd /var/www/messager/frontend-web && npm run build"

# Вернуться на Metered.ca
ssh root@89.169.39.244 "cp /var/www/messager/frontend-web/.env.production.metered.backup /var/www/messager/frontend-web/.env.production && cd /var/www/messager/frontend-web && npm run build"
```
