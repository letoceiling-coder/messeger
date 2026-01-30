# НАСТРОЙКА REDIS ДЛЯ МАСШТАБИРУЕМОСТИ

## УСТАНОВКА REDIS

### Windows
```bash
# Через Chocolatey
choco install redis-64

# Или скачать с официального сайта
# https://github.com/microsoftarchive/redis/releases
```

### macOS
```bash
brew install redis
```

### Linux
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install redis-server

# CentOS/RHEL
sudo yum install redis
```

### Docker (рекомендуется)
```bash
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

---

## ЗАПУСК REDIS

### Локально
```bash
redis-server
```

### Docker
```bash
docker start redis
# или
docker run -d -p 6379:6379 redis:7-alpine
```

---

## ПРОВЕРКА РАБОТЫ

### Проверка подключения
```bash
redis-cli ping
# Должен вернуть: PONG
```

### Проверка через Node.js
```javascript
import { createClient } from 'redis';

const client = createClient({ url: 'redis://localhost:6379' });
await client.connect();
console.log('Redis connected');
await client.disconnect();
```

---

## КОНФИГУРАЦИЯ

### Backend .env
```env
REDIS_URL=redis://localhost:6379
```

### С паролем
```env
REDIS_URL=redis://:password@localhost:6379
```

### С TLS (production)
```env
REDIS_URL=rediss://:password@your-redis-host:6380
```

---

## ТЕСТИРОВАНИЕ МАСШТАБИРУЕМОСТИ

### 1. Запустить два экземпляра Backend
```bash
# Терминал 1
PORT=3000 npm run start:dev

# Терминал 2
PORT=3001 npm run start:dev
```

### 2. Подключить клиентов к разным серверам
- Клиент 1 → http://localhost:3000
- Клиент 2 → http://localhost:3001

### 3. Отправить сообщение от клиента 1
- Сообщение должно быть доставлено клиенту 2
- Это подтверждает работу Redis адаптера

---

## МОНИТОРИНГ

### Redis CLI
```bash
redis-cli

# Просмотр всех ключей
KEYS *

# Мониторинг команд
MONITOR

# Информация о сервере
INFO
```

### Метрики
- Количество подключений
- Использование памяти
- Задержка Pub/Sub

---

## БЕЗОПАСНОСТЬ

### Production настройки
1. Установить пароль:
```bash
# В redis.conf
requirepass your-strong-password
```

2. Ограничить доступ:
```bash
# В redis.conf
bind 127.0.0.1
```

3. Использовать TLS:
```bash
# Настроить TLS сертификаты
```

---

## РЕШЕНИЕ ПРОБЛЕМ

### Redis не запускается
- Проверить, что порт 6379 свободен
- Проверить логи: `redis-server --log-level verbose`

### Ошибка подключения
- Проверить REDIS_URL в .env
- Проверить, что Redis запущен
- Проверить firewall настройки

### Backend продолжает работать без Redis
- Это нормально для разработки
- Backend выведет предупреждение в консоль
- Для production Redis обязателен

---

## АЛЬТЕРНАТИВЫ

### Облачные решения
- **Redis Cloud** (https://redis.com/cloud)
- **AWS ElastiCache**
- **Azure Cache for Redis**
- **Google Cloud Memorystore**

---

## ПРОИЗВОДИТЕЛЬНОСТЬ

### Оптимизация
- Использовать Redis Cluster для больших нагрузок
- Настроить persistence (RDB/AOF)
- Мониторить использование памяти

### Рекомендации
- Минимум 1GB RAM для Redis
- Использовать SSD для persistence
- Настроить maxmemory и eviction policy
