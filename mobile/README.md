# Messager Mobile (Expo)

Мобильное приложение для мессенджера на React Native + Expo.

## Установка

```bash
cd mobile
npm install
```

## Настройка

### Для тестирования на устройстве:

1. Узнайте IP адрес вашего компьютера в локальной сети
2. Обновите URL в файлах:
   - `src/services/api.ts` - замените `localhost` на ваш IP
   - `src/services/websocket.service.ts` - замените `localhost` на ваш IP

Пример:
```typescript
const API_URL = 'http://192.168.1.100:3000';
const WS_URL = 'http://192.168.1.100:3000';
```

## Запуск

```bash
# Запуск Expo
npm start

# Запуск на Android
npm run android

# Запуск на iOS (только macOS)
npm run ios
```

## Структура

```
mobile/
├── src/
│   ├── contexts/          # React Context (Auth, WebSocket)
│   ├── screens/           # Экраны (Login, Chats, Chat)
│   ├── services/          # API и WebSocket сервисы
│   └── types/             # TypeScript типы
├── App.tsx                # Главный компонент с навигацией
├── index.js               # Точка входа
└── app.json               # Конфигурация Expo
```

## Функционал

- ✅ Экран авторизации
- ✅ Список чатов
- ✅ Экран чата
- ✅ WebSocket подключение
- ✅ Отправка и получение сообщений в реальном времени
- ✅ Нативный UI с React Native компонентами

## Отличия от Web версии

См. `MOBILE_VS_WEB.md` для подробного сравнения.

## Требования

- Node.js 18+
- Expo CLI
- Android Studio (для Android) или Xcode (для iOS)
