# СТРУКТУРА ПРОЕКТА

## ОБЩАЯ СТРУКТУРА

```
Messager/
├── backend/                    # NestJS Backend
│   ├── src/
│   │   ├── auth/              # Аутентификация
│   │   │   ├── telegram-auth.service.ts
│   │   │   └── dto/
│   │   ├── encryption/        # E2EE модуль
│   │   │   ├── encryption.service.ts
│   │   │   ├── encryption.controller.ts
│   │   │   └── dto/
│   │   ├── websocket/         # WebSocket Gateway
│   │   │   ├── websocket.gateway.ts
│   │   │   ├── redis-adapter.config.ts
│   │   │   └── dto/
│   │   ├── messages/          # Сообщения
│   │   ├── chats/            # Чаты
│   │   ├── users/            # Пользователи
│   │   └── prisma/           # Prisma сервис
│   ├── prisma/
│   │   └── schema.prisma     # Схема БД
│   └── package.json
│
├── frontend-web/              # React + Vite Frontend
│   ├── src/
│   │   ├── services/
│   │   │   ├── encryption.service.ts  # E2EE
│   │   │   ├── websocket.service.ts
│   │   │   └── api.ts
│   │   ├── pages/
│   │   │   ├── TelegramApp.tsx        # Telegram MiniApp
│   │   │   ├── ChatPage.tsx           # С E2EE
│   │   │   └── ...
│   │   ├── components/
│   │   └── contexts/
│   └── package.json
│
├── mobile/                    # React Native (Expo)
│   ├── src/
│   │   ├── services/
│   │   │   ├── encryption.service.ts  # E2EE
│   │   │   ├── websocket.service.ts
│   │   │   └── api.ts
│   │   ├── screens/
│   │   │   └── ChatScreen.tsx         # С E2EE
│   │   └── components/
│   └── package.json
│
└── docs/                      # Документация
    ├── README.md
    ├── ARCHITECTURE.md
    ├── E2EE_ARCHITECTURE.md
    ├── REDIS_SCALING_ARCHITECTURE.md
    ├── TELEGRAM_INTEGRATION_PLAN.md
    ├── IMPLEMENTATION_GUIDE.md
    ├── TESTING_GUIDE.md
    ├── DEPLOYMENT_CHECKLIST.md
    └── ...
```

---

## КЛЮЧЕВЫЕ ФАЙЛЫ

### Backend

**E2EE:**
- `backend/src/encryption/encryption.service.ts` - сервис шифрования
- `backend/src/encryption/encryption.controller.ts` - контроллер
- `backend/src/encryption/dto/save-public-key.dto.ts` - DTO

**Redis:**
- `backend/src/websocket/redis-adapter.config.ts` - конфигурация Redis

**Telegram:**
- `backend/src/auth/telegram-auth.service.ts` - Telegram аутентификация
- `backend/src/auth/dto/telegram-auth.dto.ts` - DTO

**Схема БД:**
- `backend/prisma/schema.prisma` - обновлена для E2EE и Telegram

### Frontend Web

**E2EE:**
- `frontend-web/src/services/encryption.service.ts` - сервис шифрования
- `frontend-web/src/pages/ChatPage.tsx` - обновлен для E2EE

**Telegram:**
- `frontend-web/src/pages/TelegramApp.tsx` - страница Telegram MiniApp

### Mobile

**E2EE:**
- `mobile/src/services/encryption.service.ts` - сервис шифрования
- `mobile/src/screens/ChatScreen.tsx` - обновлен для E2EE

---

## ДОКУМЕНТАЦИЯ

### Основная
- `README.md` - главный файл проекта
- `START_HERE.md` - быстрый старт
- `PROJECT_STRUCTURE.md` - этот файл

### Архитектура
- `ARCHITECTURE.md` - общая архитектура
- `E2EE_ARCHITECTURE.md` - архитектура E2EE
- `REDIS_SCALING_ARCHITECTURE.md` - архитектура Redis
- `DATABASE_SCHEMA.md` - схема БД

### Руководства
- `DEVELOPMENT_PLAN.md` - план разработки
- `IMPLEMENTATION_GUIDE.md` - руководство по реализации
- `QUICK_START.md` - быстрый старт
- `MIGRATION_INSTRUCTIONS.md` - инструкции по миграции
- `TESTING_GUIDE.md` - тестирование

### Настройка
- `REDIS_SETUP.md` - настройка Redis
- `TELEGRAM_BOT_SETUP.md` - настройка Telegram
- `DEPLOYMENT_CHECKLIST.md` - deployment

### Статус
- `IMPLEMENTATION_SUMMARY.md` - итоговый отчет
- `FINAL_SUMMARY.md` - финальное резюме
- `COMPLETE_IMPLEMENTATION.md` - полная реализация
- `FINAL_REPORT.md` - финальный отчет

---

## ЗАВИСИМОСТИ

### Backend
- NestJS
- Prisma + PostgreSQL
- Socket.io
- Redis (опционально)
- JWT
- bcrypt
- crypto (встроенный)

### Frontend Web
- React + Vite
- TypeScript
- TailwindCSS
- Socket.io-client
- crypto-js
- Web Crypto API (встроенный)

### Mobile
- React Native (Expo)
- TypeScript
- Socket.io-client
- expo-crypto
- react-native-webrtc

---

## КОНФИГУРАЦИЯ

### Backend .env
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
REDIS_URL=redis://localhost:6379
TELEGRAM_BOT_TOKEN=...
PORT=3000
```

### Frontend Web .env
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

---

## КОМАНДЫ

### Backend
```bash
npm run start:dev      # Разработка
npm run build          # Сборка
npm run start:prod     # Production
npx prisma migrate dev # Миграция
npx prisma studio      # Prisma Studio
```

### Frontend Web
```bash
npm run dev           # Разработка
npm run build         # Сборка
npm run preview       # Превью production build
```

### Mobile
```bash
npx expo start        # Запуск Expo
npx expo start --android
npx expo start --ios
```

---

## ТЕСТИРОВАНИЕ

См. `TESTING_GUIDE.md` для полного руководства.

---

## DEPLOYMENT

См. `DEPLOYMENT_CHECKLIST.md` для полного чеклиста.
