# Поток видеозвонка и проверка TURN

## Как работает звонок по коду

### 1. Инициатор нажимает «Позвонить»

- **ChatPage** → кнопка видеозвонка вызывает `setIncomingCall(null)` и рендерит **VideoCall** с `isIncoming=false`, без `offer`.
- **VideoCall** монтируется, создаётся **WebRTCService**, вызывается `initiateCall(chatId, { video })`:
  - запрос камеры/микрофона (`getUserMedia`);
  - создание **RTCPeerConnection** (STUN + TURN из `getIceServers()`);
  - добавление локальных треков (`addTrack`);
  - подписка на `ontrack` (будущий удалённый поток), `onicecandidate` (отправка кандидатов);
  - **createOffer** → **setLocalDescription(offer)** → **emit('call:initiate', { chatId, offer })**.

### 2. Бэкенд получает call:initiate

- Проверка чата 1-на-1, получатель онлайн.
- **activeCalls.set(chatId, { callerId, receiverId })**.
- **server.to(receiverSocketId).emit('call:offer', { chatId, offer, callerId })** — получателю.
- Запуск таймера «собеседник не ответил».

### 3. У принимающего звонит телефон

- **ChatPage** в `socket.on('call:offer', handleCallOffer)` получает `call:offer`.
- Устанавливается `incomingCall` (chatId, offer, callerId), включается рингтон.
- Рендерится **VideoCall** с `isIncoming=true`, `offer=...`. Показывается экран «Входящий звонок» (Принять / Отклонить).
- В фоне при необходимости делается предзапрос медиа (`getUserMedia`) в **preCapturedStreamRef**.

### 4. Принимающий нажимает «Ответить»

- В **VideoCall** по кнопке «Принять» вызывается **handleOffer(chatId, offer, { video, preCapturedStream })**:
  - использование предзапроса или новый `getUserMedia`;
  - создание **RTCPeerConnection** (STUN + TURN);
  - **setRemoteDescription(offer)** → **drainIceQueue** (добавление уже пришедших ICE от инициатора);
  - **replaceTrack** по transceivers (аудио/видео ответчика);
  - **createAnswer** → **setLocalDescription(answer)** → **emit('call:answer', { chatId, answer })**;
  - параллельно **onicecandidate** шлёт кандидаты ответчика через **call:ice-candidate**.

### 5. Бэкенд получает call:answer

- **server.to(callerSocketId).emit('call:answer', { chatId, answer })** — только инициатору.
- ICE-кандидаты от обеих сторон продолжают идти через **call:ice-candidate** и пересылаются друг другу.

### 6. У инициатора открывается поток видео и аудио

- В **WebRTCService** срабатывает обработчик **call:answer**:
  - **setRemoteDescription(answer)** → **drainIceQueue** (кандидаты от ответчика);
  - дальше приходят **call:ice-candidate** и добавляются через **addIceCandidateSafe**.
- Когда ICE переходит в **connected**, срабатывают **ontrack** у обеих сторон → **onRemoteStreamCallback** → в UI подставляется **remoteStream** (видео/аудио).

### 7. Итог

- Инициатор: локальный поток при `initiateCall`, удалённый — после **call:answer** и успешного ICE.
- Принимающий: локальный поток при **handleOffer**, удалённый — после успешного ICE от инициатора.

---

## Почему «disconnected» / «failed»

В логах видно: **iceConnectionState: checking** → **disconnected** → **connectionState: failed**. Это значит, что ICE не смог построить путь между двумя пирами.

Частые причины:

1. **TURN недоступен**  
   - Порт 3478 (UDP/TCP) или диапазон 49152–65535 (UDP) закрыты на VPS или у хостера.  
   - Нужно открыть их в панели хостинга и/или в ufw.

2. **TURN не достигается с телефона или с ПК**  
   - Мобильный оператор или корпоративный файрвол блокируют UDP до вашего VPS.  
   - С ПК проверьте: `telnet 89.169.39.244 3478` или тест TURN в браузере.

3. **Неверный external-ip в coturn**  
   - В `/etc/turnserver.conf` должно быть `external-ip=<реальный внешний IP VPS>`.  
   - Иначе реле может не работать.

4. **Принудительный relay (TURN-only)**  
   - Раньше на мобильном включали **iceTransportPolicy: 'relay'**. Если TURN недоступен, тогда соединение всегда падает.  
   - Сейчас relay не принуждается: используются и STUN, и TURN; если TURN не отвечает, остаётся шанс через STUN/прямое соединение (где это возможно).

---

## Что проверить на сервере

```bash
# coturn слушает 3478
ss -ulnp | grep 3478

# Логи coturn (если настроен log-file)
tail -50 /var/log/turnserver/turnserver.log

# На хосте: открыты ли порты снаружи (с другого ПК или телефона)
# UDP 3478, TCP 3478, UDP 49152-65535
```

В панели хостинга (если есть файрвол) — открыть те же порты.

---

## Краткая схема потока

```
[Инициатор]                    [Сервер]                    [Принимающий]
     |                             |                              |
     | call:initiate { offer }     |                              |
     |---------------------------->|  call:offer { offer }        |
     |                             |----------------------------->|  звонит
     |                             |                              |
     |     call:ice-candidate      |     call:ice-candidate       |
     |<----------------------------|------------------------------>|
     |                             |                              |
     |                             |  call:answer { answer }       |
     |  call:answer { answer }     |<------------------------------|  нажал «Принять»
     |<----------------------------|                              |
     |                             |                              |
     |     call:ice-candidate      |     call:ice-candidate       |
     |<----------------------------|------------------------------>|
     |                             |                              |
     |  ICE connected → ontrack → remoteStream (видео/звук) у обоих
```

После успешного ICE у обоих открывается локальный и удалённый поток (видео и звук).
