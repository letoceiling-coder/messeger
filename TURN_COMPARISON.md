# Сравнение настроек TURN (31.01.2026)

## 🔵 Собственный TURN (coturn на сервере)

**Адрес:** turn:89.169.39.244:3478  
**Логин:** turn_fdf8b6e8  
**Пароль:** U1cM4fhoxxqTnbb8XE9n  
**Статус:** ✅ Работает (active running 1d 5h)

### Конфигурация `/etc/turnserver.conf`:
```conf
listening-ip=0.0.0.0
relay-ip=0.0.0.0
listening-port=3478
tls-listening-port=5349
external-ip=89.169.39.244
realm=neekloai.ru
lt-cred-mech
user=turn_fdf8b6e8:U1cM4fhoxxqTnbb8XE9n
log-file=/var/log/turnserver/turnserver.log
verbose
```

### Для фронтенда:
```env
VITE_TURN_URL=turn:89.169.39.244:3478
VITE_TURN_USER=turn_fdf8b6e8
VITE_TURN_CREDENTIAL=U1cM4fhoxxqTnbb8XE9n
```

---

## 🌐 Облачный TURN (Metered.ca) - ТЕКУЩИЙ

**Адрес:** turn:global.relay.metered.ca:80  
**Логин:** 77f6dd0527ac33be2f81633f  
**Пароль:** f8VrDZhPIgII74E6

### Для фронтенда:
```env
VITE_TURN_URL=turn:global.relay.metered.ca:80
VITE_TURN_USER=77f6dd0527ac33be2f81633f
VITE_TURN_CREDENTIAL=f8VrDZhPIgII74E6
```

---

## 📝 План действий:

1. ✅ Сохранить текущие настройки (Metered.ca)
2. ⏳ Проверить порты для собственного TURN
3. ⏳ Переключиться на собственный TURN
4. ⏳ Пересобрать фронтенд
5. ⏳ Протестировать звонки
6. ⏳ Если не работает - вернуться к Metered.ca
