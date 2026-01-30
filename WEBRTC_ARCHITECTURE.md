# АРХИТЕКТУРА WEBRTC ВИДЕОЗВОНКОВ

## ОБЩАЯ СХЕМА

```
Клиент A                    Backend                    Клиент B
   │                           │                           │
   │─── call:initiate ────────>│                           │
   │   {chatId, offer}         │                           │
   │                           │─── call:offer ───────────>│
   │                           │   {chatId, offer}         │
   │                           │                           │
   │                           │<─── call:answer ──────────│
   │<─── call:answer ──────────│   {chatId, answer}       │
   │   {chatId, answer}        │                           │
   │                           │                           │
   │<─── ICE Candidate ────────│─── ICE Candidate ───────>│
   │                           │                           │
   │<══════════════════════════════════════════════════════>│
   │              P2P WebRTC Connection                     │
   │              (Video + Audio)                           │
```

---

## КОМПОНЕНТЫ

### 1. SIGNALING (WebSocket)

**Назначение:** Обмен SDP (Session Description Protocol) и ICE кандидатами между клиентами

**События:**

#### Клиент → Сервер → Клиент

| Событие | Отправитель | Получатель | Данные |
|---------|-------------|------------|--------|
| `call:initiate` | Инициатор | Сервер | `{chatId, offer}` |
| `call:offer` | Сервер | Получатель | `{chatId, offer, callerId}` |
| `call:answer` | Получатель | Сервер | `{chatId, answer}` |
| `call:answer` | Сервер | Инициатор | `{chatId, answer}` |
| `call:ice-candidate` | Любой | Сервер | `{chatId, candidate}` |
| `call:ice-candidate` | Сервер | Другой | `{chatId, candidate}` |
| `call:end` | Любой | Сервер | `{chatId}` |
| `call:end` | Сервер | Другой | `{chatId}` |
| `call:reject` | Получатель | Сервер | `{chatId}` |
| `call:reject` | Сервер | Инициатор | `{chatId}` |

---

## ПОТОК ВИДЕОЗВОНКА

### Шаг 1: Инициация звонка

```
1. Клиент A создает RTCPeerConnection
2. Получает локальный медиа-поток (getUserMedia)
3. Создает offer (createOffer)
4. Устанавливает локальное описание (setLocalDescription)
5. Отправляет offer через WebSocket: call:initiate {chatId, offer}
```

### Шаг 2: Получение звонка

```
1. Сервер получает call:initiate
2. Проверяет, что оба пользователя в чате
3. Отправляет call:offer получателю (Клиент B)
4. Клиент B получает звонок
5. Показывает UI для принятия/отклонения
```

### Шаг 3: Принятие звонка

```
1. Клиент B создает RTCPeerConnection
2. Получает локальный медиа-поток
3. Устанавливает удаленное описание (setRemoteDescription) с offer
4. Создает answer (createAnswer)
5. Устанавливает локальное описание
6. Отправляет answer: call:answer {chatId, answer}
```

### Шаг 4: Обмен ICE кандидатами

```
1. Каждый клиент собирает ICE кандидаты
2. Отправляет через WebSocket: call:ice-candidate {chatId, candidate}
3. Сервер пересылает другому клиенту
4. Клиенты добавляют кандидаты (addIceCandidate)
```

### Шаг 5: Установка P2P соединения

```
1. WebRTC устанавливает P2P соединение
2. Медиа-потоки начинают передаваться напрямую
3. Видео и аудио отображаются на обоих клиентах
```

### Шаг 6: Завершение звонка

```
1. Любой клиент отправляет call:end {chatId}
2. Сервер уведомляет другого клиента
3. Оба клиента закрывают RTCPeerConnection
4. Останавливают медиа-потоки
```

---

## STUN/TURN СЕРВЕРЫ

### STUN (Session Traversal Utilities for NAT)

**Назначение:** Определение публичного IP адреса клиента

**Примеры:**
- Google STUN: `stun:stun.l.google.com:19302`
- Twilio STUN: `stun:global.stun.twilio.com:3478`

**Использование:**
```javascript
{
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
}
```

### TURN (Traversal Using Relays around NAT)

**Назначение:** Релейный сервер для клиентов за сложными NAT/Firewall

**Когда нужен:**
- Симметричный NAT
- Строгий Firewall
- Корпоративные сети

**Примеры:**
- Twilio TURN (платный)
- coturn (open-source, можно развернуть свой)

**Использование:**
```javascript
{
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { 
      urls: 'turn:turn.example.com:3478',
      username: 'user',
      credential: 'pass'
    }
  ]
}
```

---

## АРХИТЕКТУРА КОДА

### Backend (WebSocket Gateway)

```typescript
// Обработка событий звонков
@SubscribeMessage('call:initiate')
async handleCallInitiate(client, data) {
  // Проверка прав доступа
  // Отправка call:offer получателю
}

@SubscribeMessage('call:answer')
async handleCallAnswer(client, data) {
  // Отправка answer инициатору
}

@SubscribeMessage('call:ice-candidate')
async handleIceCandidate(client, data) {
  // Пересылка кандидата другому клиенту
}

@SubscribeMessage('call:end')
async handleCallEnd(client, data) {
  // Уведомление другого клиента
}
```

### Frontend Web

```typescript
// WebRTC Service
class WebRTCService {
  private peerConnection: RTCPeerConnection;
  private localStream: MediaStream;
  
  async initiateCall(chatId, remoteUserId) {
    // Создание RTCPeerConnection
    // Получение медиа-потока
    // Создание offer
    // Отправка через WebSocket
  }
  
  async handleOffer(offer) {
    // Установка remote description
    // Создание answer
    // Отправка answer
  }
  
  async handleAnswer(answer) {
    // Установка remote description
  }
  
  async handleIceCandidate(candidate) {
    // Добавление ICE кандидата
  }
}
```

### Mobile (Expo)

```typescript
// WebRTC через react-native-webrtc
import { RTCPeerConnection, RTCView, mediaDevices } from 'react-native-webrtc';

class WebRTCService {
  private peerConnection: RTCPeerConnection;
  private localStream: MediaStream;
  
  // Аналогичная логика как в Web
}
```

---

## БЕЗОПАСНОСТЬ

### 1. Проверка прав доступа
- Только участники чата могут инициировать звонок
- Проверка на сервере перед пересылкой событий

### 2. Валидация данных
- Проверка формата SDP
- Проверка формата ICE кандидатов

### 3. Таймауты
- Таймаут ожидания ответа (30 секунд)
- Автоматическое завершение неотвеченных звонков

---

## ОБРАБОТКА ОШИБОК

### Типы ошибок:

1. **Пользователь не в чате:**
   - Событие: `call:error {message: 'Access denied'}`

2. **Получатель оффлайн:**
   - Событие: `call:error {message: 'User offline'}`

3. **Звонок отклонен:**
   - Событие: `call:rejected {chatId}`

4. **Ошибка WebRTC:**
   - Обработка на клиенте
   - Уведомление пользователя

---

## UI КОМПОНЕНТЫ

### Web

```tsx
<VideoCall>
  <LocalVideo stream={localStream} />
  <RemoteVideo stream={remoteStream} />
  <CallControls onEnd={handleEndCall} />
</VideoCall>
```

### Mobile

```tsx
<View>
  <RTCView streamURL={remoteStream.toURL()} />
  <RTCView streamURL={localStream.toURL()} style={styles.localVideo} />
  <TouchableOpacity onPress={handleEndCall}>
    <Text>Завершить</Text>
  </TouchableOpacity>
</View>
```

---

## ОПТИМИЗАЦИЯ

### 1. Качество видео
- Адаптивное качество в зависимости от сети
- Ограничение разрешения для мобильных

### 2. Аудио
- Отключение видео (audio-only call)
- Mute/Unmute

### 3. Производительность
- Использование hardware acceleration
- Оптимизация кодека (VP8, VP9, H.264)

---

## STUN/TURN КОНФИГУРАЦИЯ

### Для разработки (STUN только):
```javascript
{
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
}
```

### Для production (STUN + TURN):
```javascript
{
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { 
      urls: 'turn:your-turn-server.com:3478',
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_PASSWORD
    }
  ]
}
```

---

## ПОТОК ДАННЫХ (ПОЛНЫЙ)

```
1. Инициатор:
   - getUserMedia() → localStream
   - new RTCPeerConnection()
   - addStream(localStream)
   - createOffer() → offer
   - setLocalDescription(offer)
   - WebSocket: call:initiate {offer}

2. Сервер:
   - Проверка прав
   - WebSocket: call:offer {offer} → Получатель

3. Получатель:
   - Показ UI "Входящий звонок"
   - При принятии:
     - getUserMedia() → localStream
     - new RTCPeerConnection()
     - addStream(localStream)
     - setRemoteDescription(offer)
     - createAnswer() → answer
     - setLocalDescription(answer)
     - WebSocket: call:answer {answer}

4. Сервер:
   - WebSocket: call:answer {answer} → Инициатор

5. Инициатор:
   - setRemoteDescription(answer)

6. Оба клиента:
   - onicecandidate → WebSocket: call:ice-candidate
   - Сервер пересылает кандидаты
   - addIceCandidate()

7. Установка соединения:
   - onaddstream → remoteStream
   - Отображение видео

8. Завершение:
   - WebSocket: call:end
   - close() RTCPeerConnection
   - stop() медиа-потоки
```

---

## ТЕХНОЛОГИИ

### Web
- WebRTC API (нативный)
- MediaDevices.getUserMedia()
- RTCPeerConnection

### Mobile
- react-native-webrtc
- expo-av (альтернатива, но WebRTC лучше)

### Backend
- WebSocket (Socket.io) для signaling
- Не требуется медиа-сервер (P2P)

---

## ОГРАНИЧЕНИЯ MVP

- ✅ Только 1-на-1 звонки
- ✅ Видео + аудио
- ✅ Signaling через WebSocket
- ✅ STUN серверы (публичные)
- ❌ TURN сервер (нужен для production)
- ❌ Групповые звонки
- ❌ Запись звонков
- ❌ Screen sharing

---

## ИТОГОВАЯ АРХИТЕКТУРА

1. **Signaling:** WebSocket (Socket.io)
2. **Media:** WebRTC P2P
3. **STUN:** Публичные серверы (Google)
4. **TURN:** Опционально (для production)
5. **Безопасность:** Проверка прав на сервере
6. **UI:** Компоненты для отображения видео и управления

Все медиа-данные передаются напрямую между клиентами (P2P), сервер только помогает установить соединение через signaling.
