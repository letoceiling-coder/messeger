# Messenger Mobile (React Native)

Мобильное приложение мессенджера для Android и iOS.

## 📋 Требования

### Общие:
- Node.js >= 18
- npm или yarn
- Git

### Android:
- JDK 17
- Android SDK (API 33+)
- Android Studio

### iOS (только macOS):
- Xcode 14+
- CocoaPods
- iOS 13+

---

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
cd mobile
npm install

# Для iOS (только на macOS)
cd ios
pod install
cd ..
```

### 2. Настройка API

Отредактируйте `src/config/api.ts` и укажите адрес вашего сервера:

```typescript
export const API_BASE_URL = 'http://YOUR_SERVER_IP:3001';
export const WS_BASE_URL = 'ws://YOUR_SERVER_IP:3001';
```

**Для локальной разработки:**
- Android эмулятор: `http://10.0.2.2:3001`
- iOS симулятор: `http://localhost:3001`
- Реальное устройство: `http://192.168.X.X:3001` (ваш локальный IP)

### 3. Запуск

#### Android:

```bash
npm run android
```

#### iOS (только macOS):

```bash
npm run ios
```

#### Только Metro Bundler:

```bash
npm start
```

---

## 📁 Структура проекта

```
mobile/
├── android/                 # Android native код
├── ios/                     # iOS native код
├── src/
│   ├── components/          # UI компоненты
│   ├── screens/             # Экраны
│   │   ├── auth/            # Вход/регистрация
│   │   └── main/            # Основные экраны
│   ├── navigation/          # Навигация
│   ├── contexts/            # React контексты
│   ├── services/            # Сервисы (API, WebSocket, etc.)
│   ├── utils/               # Утилиты
│   ├── types/               # TypeScript типы
│   ├── assets/              # Изображения, звуки
│   ├── config/              # Конфигурация
│   └── App.tsx              # Главный компонент
├── index.js                 # Точка входа
├── package.json
├── tsconfig.json
└── babel.config.js
```

---

## 🔧 Конфигурация

### Firebase (Push уведомления)

1. Создайте проект в [Firebase Console](https://console.firebase.google.com/)

2. **Android:**
   - Скачайте `google-services.json`
   - Поместите в `android/app/`

3. **iOS:**
   - Скачайте `GoogleService-Info.plist`
   - Добавьте в Xcode проект

4. Настройте FCM Server Key в вашем backend

### Android Manifest

Файл: `android/app/src/main/AndroidManifest.xml`

Необходимые разрешения:
- `INTERNET`
- `CAMERA`
- `RECORD_AUDIO`
- `READ_EXTERNAL_STORAGE`
- `WRITE_EXTERNAL_STORAGE`
- `VIBRATE`
- `POST_NOTIFICATIONS` (Android 13+)

### iOS Info.plist

Файл: `ios/MessengerMobile/Info.plist`

Необходимые описания разрешений:
- `NSCameraUsageDescription`
- `NSMicrophoneUsageDescription`
- `NSPhotoLibraryUsageDescription`
- `NSUserNotificationsUsageDescription`

---

## 📦 Сборка для production

### Android APK:

```bash
cd android
./gradlew assembleRelease
```

APK будет в: `android/app/build/outputs/apk/release/app-release.apk`

### Android AAB (для Google Play):

```bash
cd android
./gradlew bundleRelease
```

AAB будет в: `android/app/build/outputs/bundle/release/app-release.aab`

### iOS:

1. Откройте `ios/MessengerMobile.xcworkspace` в Xcode
2. Выберите схему "Release"
3. Product → Archive
4. Экспортируйте IPA

---

## 🔔 Push уведомления

### Настройка:

1. **Firebase:**
   - Включите Cloud Messaging в Firebase Console
   - Настройте FCM Server Key

2. **Backend:**
   - Установите `firebase-admin`
   - Интегрируйте отправку уведомлений

3. **Mobile:**
   - Токены устройств автоматически регистрируются
   - Обработчики уведомлений в `src/services/notificationService.ts`

### Тестирование:

```bash
# Отправить тестовое уведомление через Firebase Console
# или через curl к вашему backend API
```

---

## 🎵 Рингтоны

Звуковые файлы должны быть в:
- Android: `android/app/src/main/res/raw/`
- iOS: `ios/MessengerMobile/Sounds/`

Форматы:
- Android: `.mp3`, `.wav`, `.ogg`
- iOS: `.caf`, `.aiff`, `.wav`

---

## 🔄 OTA Обновления (CodePush)

### Установка:

```bash
npm install -g appcenter-cli
appcenter login
```

### Настройка:

```bash
# Создать приложение в App Center
appcenter apps create -d MessengerMobile-Android -o Android -p React-Native
appcenter apps create -d MessengerMobile-iOS -o iOS -p React-Native

# Получить deployment keys
appcenter codepush deployment list -a YOUR_ORG/MessengerMobile-Android
```

### Публикация обновления:

```bash
# Android
appcenter codepush release-react -a YOUR_ORG/MessengerMobile-Android

# iOS
appcenter codepush release-react -a YOUR_ORG/MessengerMobile-iOS
```

---

## 🧪 Тестирование

```bash
# Unit тесты
npm test

# E2E тесты (Detox)
npm run test:e2e:ios
npm run test:e2e:android
```

---

## 📱 Отладка

### React Native Debugger:

```bash
# Открыть меню разработчика
# Android: Cmd/Ctrl + M
# iOS: Cmd + D

# Включить "Debug JS Remotely"
```

### Логи:

```bash
# Android
adb logcat | grep ReactNative

# iOS
xcrun simctl spawn booted log stream --predicate 'processImagePath endswith "MessengerMobile"'
```

---

## 🔒 Безопасность

### Хранение токенов:

Используется `@react-native-async-storage/async-storage` с шифрованием (Android Keystore, iOS Keychain)

### HTTPS:

В production всегда используйте HTTPS для API

### E2EE:

Клиентское шифрование реализовано через `crypto-js`

---

## 🌐 Локализация

Файлы переводов в: `src/i18n/`

Поддерживаемые языки:
- Русский (по умолчанию)
- Английский (TODO)

---

## 🐛 Известные проблемы

### Android:

- **Проблема:** Белый экран при запуске
- **Решение:** Очистить кэш `npm start -- --reset-cache`

### iOS:

- **Проблема:** "Unable to boot device"
- **Решение:** Перезапустить симулятор

---

## 📚 Документация

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [React Native WebRTC](https://github.com/react-native-webrtc/react-native-webrtc)

---

## 🤝 Contributing

1. Fork проект
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

---

## 📄 Лицензия

Проприетарная лицензия. Все права защищены.

---

## 🎯 TODO

- [ ] Настроить CodePush
- [ ] Добавить E2E тесты
- [ ] Оптимизировать размер APK/IPA
- [ ] Добавить биометрическую аутентификацию
- [ ] Реализовать виджеты
- [ ] Добавить темную тему для Android 12+
- [ ] Оптимизировать батарею (background restrictions)

---

## 📞 Поддержка

Если у вас есть вопросы или проблемы:
1. Проверьте [Issues](../issues)
2. Создайте новый issue с описанием проблемы
3. Приложите логи и скриншоты

---

**Версия:** 1.0.0  
**Дата:** 2026-01-31
