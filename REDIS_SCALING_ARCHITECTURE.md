# АРХИТЕКТУРА МАСШТАБИРУЕМОСТИ ЧЕРЕЗ REDIS

## ПРОБЛЕМА

При использовании нескольких серверов Node.js:
- WebSocket соединения распределены между серверами
- Сообщение от пользователя на сервере A не может быть отправлено пользователю на сервере B
- Нужен механизм синхронизации между серверами

## РЕШЕНИЕ: REDIS ADAPTER ДЛЯ SOCKET.IO

### Архитектура

```
Клиент A ──> Сервер 1 ──┐
                         ├──> Redis ──> Socket.io Adapter
Клиент B ──> Сервер 2 ──┘
                         │
Клиент C ──> Сервер 3 ──┘
```

**Как это работает:**
1. Все серверы подключаются к одному Redis
2. Socket.io использует Redis Adapter для синхронизации
3. Сообщение от сервера 1 автоматически доставляется клиентам на всех серверах

---

## УСТАНОВКА И НАСТРОЙКА

### Зависимости
```bash
npm install @socket.io/redis-adapter redis
npm install --save-dev @types/redis
```

### Конфигурация

**Backend (main.ts или websocket.module.ts):**
```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

---

## ОБНОВЛЕНИЕ WEBSOCKET GATEWAY

### Текущая реализация
- Использует локальную Map для хранения соединений
- Не работает при нескольких серверах

### Новая реализация
- Redis Adapter автоматически синхронизирует комнаты
- `server.to('room')` работает на всех серверах

---

## КОНФИГУРАЦИЯ REDIS

### Переменные окружения
```env
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD= (опционально)
```

### Docker Compose (для разработки)
```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

---

## ПРОВЕРКА РАБОТЫ

### Тестирование с несколькими серверами
1. Запустить несколько экземпляров Backend (разные порты)
2. Подключить клиентов к разным серверам
3. Отправить сообщение от клиента на сервере 1
4. Проверить, что клиент на сервере 2 получил сообщение

---

## ОПТИМИЗАЦИЯ

### Redis Pub/Sub
- Socket.io использует Redis Pub/Sub для синхронизации
- Минимальная задержка
- Автоматическая синхронизация комнат

### Кэширование
- Можно использовать Redis для кэширования данных
- Кэш пользователей, чатов, сообщений

---

## МОНИТОРИНГ

### Redis CLI
```bash
redis-cli
> MONITOR  # Просмотр всех команд
> INFO     # Информация о Redis
```

### Метрики
- Количество подключений
- Использование памяти
- Задержка Pub/Sub

---

## БЕЗОПАСНОСТЬ

### Аутентификация Redis
- Использовать пароль для Redis
- Ограничить доступ к Redis (firewall)

### Шифрование
- Использовать TLS для подключения к Redis (redis:// → rediss://)

---

## АЛЬТЕРНАТИВЫ

### Socket.io с другими адаптерами
- MongoDB Adapter
- PostgreSQL Adapter
- RabbitMQ Adapter

**Redis рекомендуется** для высокой производительности и низкой задержки.
