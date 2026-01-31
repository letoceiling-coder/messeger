# Резервная копия настроек TURN (31.01.2026)

## Текущие настройки в webrtc.service.ts

### Конфигурация ICE серверов:

**Если настроены переменные окружения:**
- `VITE_TURN_USER` и `VITE_TURN_CREDENTIAL` 

Используется **Metered.ca** TURN сервер:
```javascript
servers.push({ urls: 'stun:stun.relay.metered.ca:80' });
servers.push({
  urls: 'turn:global.relay.metered.ca:80',
  username: VITE_TURN_USER,
  credential: VITE_TURN_CREDENTIAL,
});
servers.push({
  urls: 'turn:global.relay.metered.ca:80?transport=tcp',
  username: VITE_TURN_USER,
  credential: VITE_TURN_CREDENTIAL,
});
servers.push({
  urls: 'turn:global.relay.metered.ca:443',
  username: VITE_TURN_USER,
  credential: VITE_TURN_CREDENTIAL,
});
servers.push({
  urls: 'turns:global.relay.metered.ca:443?transport=tcp',
  username: VITE_TURN_USER,
  credential: VITE_TURN_CREDENTIAL,
});
```

**Если переменные НЕ настроены (Fallback):**
Используется только **Google STUN** (без TURN):
```javascript
servers.push({ urls: 'stun:stun.l.google.com:19302' });
servers.push({ urls: 'stun:stun1.l.google.com:19302' });
servers.push({ urls: 'stun:stun2.l.google.com:19302' });
```

## Важно:

- **Metered.ca** - бесплатный TURN сервер (50 GB/месяц)
- **Google STUN** - работает только для прямых соединений, НЕ работает через NAT/Firewall
- Для видеозвонков через интернет ОБЯЗАТЕЛЕН TURN сервер

## Файлы для восстановления:

- `frontend-web/src/services/webrtc.service.ts` - строки 4-56
