# Проблема: TURN не работает на Beget VPS (UDP заблокирован)

## Симптомы

- **coturn** работает на VPS, слушает 3478 (UDP/TCP).
- **Тест trickle-ice** не генерирует relay кандидаты (только host).
- **Звонок с телефона на ПК:** ICE → checking → **failed/disconnected**.
- **Логи телефона:** очень мало ICE кандидатов (только 2 local), relay не появляются.

## Диагноз

**UDP порты (3478 и 49152-65535) заблокированы на уровне хостинга Beget.** Coturn работает локально, но входящий UDP-трафик не доходит до VPS.

---

## Решения

### 1. Обратиться в техподдержку Beget (рекомендуется)

**Тикет/чат:**
> Добрый день! Использую VPS для TURN-сервера (WebRTC). Нужно открыть входящий UDP на портах:
> - **3478** (TURN)
> - **49152–65535** (TURN relay)
> 
> Порты слушаются на VPS (coturn), но извне UDP не доходит. Возможно, блокируется на уровне хостинга. Можно ли открыть эти порты или отключить UDP-фильтрацию для моего VPS?

### 2. Проверить "Cloud Firewall" в личном кабинете Beget

Если в панели Beget есть раздел **"Защита"** / **"DDoS-защита"** / **"Сеть"** — проверьте, нет ли там правил, блокирующих UDP. Добавьте разрешающие правила для:
- UDP 3478
- UDP 49152-65535

### 3. Использовать облачный TURN (быстрый тест)

Чтобы убедиться, что проблема в Beget, а не в коде:

**На VPS выполнить:**
```bash
cd /var/www/messager
bash scripts/switch-to-cloud-turn.sh
```

Скрипт:
- Сделает бэкап текущего `.env.production`.
- Переключит на бесплатный TURN от **Metered.ca** (openrelay).
- Пересоберёт фронт.

**Попробуйте звонок с телефона на ПК.**  
Если ICE → **connected** — проблема точно в Beget UDP.

**Вернуть свой TURN:**
```bash
cp /var/www/messager/frontend-web/.env.production.backup /var/www/messager/frontend-web/.env.production
cd /var/www/messager/frontend-web && npm run build
```

---

## Альтернативы (если Beget не разблокирует UDP)

1. **Перенести VPS на другой хостинг:**
   - Hetzner, DigitalOcean, Vultr — у них есть управление файрволом в панели.
   - Или любой VPS с открытыми UDP портами по умолчанию.

2. **Использовать облачный TURN постоянно:**
   - **Metered.ca** — бесплатный tier (5 GB/месяц).
   - **Twilio TURN** — платный, но надёжный.
   - **Xirsys** — платный, но с trial.

3. **TCP TURN (если UDP не открывается):**
   - Изменить `iceTransportPolicy` на TCP TURN (медленнее, но работает).
   - В `.env.production`:
     ```
     VITE_TURN_URL=turn:89.169.39.244:3478?transport=tcp
     ```
   - **Но:** для relay всё равно нужен UDP-диапазон 49152-65535.

---

## Проверка после открытия портов

1. **Тест на trickle-ice:**
   - https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
   - Добавить TURN (89.169.39.244:3478, turn_fdf8b6e8, пароль из .env.production)
   - Нажать "Gather candidates"
   - Должны появиться **relay** кандидаты (srflx или relay).

2. **Звонок с телефона на ПК:**
   - Логи на телефоне должны показать много ICE кандидатов (host + relay).
   - ICE должен дойти до **connected**.

---

## Краткая схема проблемы

```
Телефон (мобильная сеть)
    |
    | UDP 3478 (TURN request)
    v
[Beget Firewall] ❌ BLOCKED
    |
    v
VPS 89.169.39.244 (coturn слушает 3478)
```

**Решение:** Открыть UDP на уровне Beget или использовать облачный TURN.
