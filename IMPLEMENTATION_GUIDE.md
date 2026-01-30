# РУКОВОДСТВО ПО РЕАЛИЗАЦИИ E2EE, REDIS И TELEGRAM

## ✅ ВЫПОЛНЕНО

### 1. E2EE (End-to-End Encryption)

#### Backend
- ✅ Обновлена схема БД (UserKey, поля шифрования в Message)
- ✅ Создан EncryptionModule с сервисом шифрования
- ✅ Реализованы методы:
  - `generateKeyPair()` - генерация RSA ключей
  - `encryptWithPublicKey()` - шифрование RSA
  - `decryptWithPrivateKey()` - дешифрование RSA
  - `encryptAES()` - шифрование AES-256-GCM
  - `decryptAES()` - дешифрование AES-256-GCM
- ✅ Endpoints:
  - `POST /encryption/public-key` - сохранение публичного ключа
  - `GET /encryption/public-key/:userId` - получение публичного ключа
- ✅ Обновлен MessagesService для поддержки зашифрованных сообщений
- ✅ Обновлен WebSocket Gateway для передачи зашифрованных данных

#### Требуется реализовать на клиенте:

**Frontend Web:**
1. Создать `src/services/encryption.service.ts`:
   - Генерация RSA ключей (используя Web Crypto API или библиотеку)
   - Шифрование/дешифрование сообщений
   - Хранение приватного ключа в localStorage

2. Обновить `src/services/websocket.service.ts`:
   - Добавить поддержку зашифрованных сообщений

3. Обновить `src/pages/ChatPage.tsx`:
   - Шифрование перед отправкой
   - Дешифрование после получения

**Mobile:**
1. Создать `src/services/encryption.service.ts`:
   - Использовать `expo-crypto` или `react-native-crypto`
   - Хранение ключей в AsyncStorage

2. Обновить компоненты чата аналогично Web

---

### 2. REDIS для масштабируемости

#### Требуется реализовать:

**Backend:**
1. Обновить `backend/src/main.ts` или `websocket.module.ts`:
```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

2. Добавить в `.env`:
```
REDIS_URL=redis://localhost:6379
```

3. WebSocket Gateway автоматически будет работать с Redis через адаптер

---

### 3. TELEGRAM MINIAPP

#### Требуется реализовать:

**Backend:**
1. Создать `backend/src/auth/telegram-auth.service.ts`:
   - Проверка initData (HMAC SHA-256)
   - Создание/обновление пользователя по telegramId

2. Создать `backend/src/auth/telegram-auth.controller.ts`:
   - `POST /auth/telegram` - аутентификация через Telegram

3. Добавить в `.env`:
```
TELEGRAM_BOT_TOKEN=your_bot_token
```

**Frontend (Telegram WebView):**
1. Создать `frontend-web/src/services/telegram.service.ts`:
   - Обертка над Telegram WebApp API
   - Получение initData

2. Создать `frontend-web/src/pages/TelegramApp.tsx`:
   - Автоматическая аутентификация при загрузке
   - Адаптация UI под Telegram стиль

---

## 📋 ПОРЯДОК ВЫПОЛНЕНИЯ

### Шаг 1: Миграция БД
```bash
cd backend
npx prisma migrate dev --name add_e2ee_and_telegram
npx prisma generate
```

### Шаг 2: Настройка Redis
```bash
# Установить Redis (Docker)
docker run -d -p 6379:6379 redis:7-alpine

# Или установить локально
```

### Шаг 3: Реализация клиентской части E2EE
- Создать сервисы шифрования на Frontend Web и Mobile
- Интегрировать в компоненты чата

### Шаг 4: Настройка Redis адаптера
- Обновить main.ts для подключения Redis
- Протестировать с несколькими серверами

### Шаг 5: Telegram MiniApp
- Создать Telegram Bot через @BotFather
- Реализовать аутентификацию
- Создать Frontend для WebView

---

## 🔧 БИБЛИОТЕКИ ДЛЯ КЛИЕНТА

### Frontend Web
```bash
npm install crypto-js
# или использовать Web Crypto API (встроенный)
```

### Mobile
```bash
npx expo install expo-crypto
# или
npm install react-native-crypto
```

---

## 📝 ПРИМЕРЫ КОДА

### Клиентское шифрование (Frontend Web)

```typescript
// src/services/encryption.service.ts
import CryptoJS from 'crypto-js';

export class EncryptionService {
  private privateKey: string | null = null;
  private chatKeys: Map<string, string> = new Map();

  async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    // Использовать Web Crypto API или библиотеку
    // Сохранить приватный ключ в localStorage
  }

  async encryptMessage(content: string, chatId: string): Promise<{
    encrypted: string;
    iv: string;
  }> {
    const aesKey = this.chatKeys.get(chatId);
    if (!aesKey) {
      throw new Error('AES key not found for chat');
    }
    // Шифрование AES
  }

  async decryptMessage(encrypted: string, iv: string, chatId: string): Promise<string> {
    const aesKey = this.chatKeys.get(chatId);
    if (!aesKey) {
      throw new Error('AES key not found for chat');
    }
    // Дешифрование AES
  }
}
```

---

## ⚠️ ВАЖНЫЕ ЗАМЕЧАНИЯ

1. **Безопасность ключей:**
   - Приватные ключи хранятся только на клиенте
   - Можно дополнительно защитить паролем пользователя

2. **Производительность:**
   - RSA шифрование медленное, используется только для обмена AES ключами
   - AES шифрование быстрое, используется для сообщений

3. **Совместимость:**
   - Зашифрованные и незашифрованные сообщения могут сосуществовать
   - Поле `isEncrypted` определяет тип сообщения

---

## 🧪 ТЕСТИРОВАНИЕ

1. **E2EE:**
   - Создать двух пользователей
   - Обменяться публичными ключами
   - Отправить зашифрованное сообщение
   - Проверить дешифрование

2. **Redis:**
   - Запустить два экземпляра Backend
   - Подключить клиентов к разным серверам
   - Отправить сообщение
   - Проверить доставку на другом сервере

3. **Telegram:**
   - Создать Bot через @BotFather
   - Настроить MiniApp URL
   - Протестировать аутентификацию
   - Проверить работу в Telegram WebView
