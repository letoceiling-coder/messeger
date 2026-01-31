# 🔥 Firebase Setup Guide

Пошаговая инструкция по настройке Firebase для Push уведомлений.

---

## 📋 Предварительные требования

- Google аккаунт
- Проект React Native запущен
- Доступ к Firebase Console

---

## 🚀 Шаг 1: Создание проекта Firebase

### 1.1. Перейти в Firebase Console

Откройте: [https://console.firebase.google.com/](https://console.firebase.google.com/)

### 1.2. Создать новый проект

1. Нажмите **"Add project"** (Добавить проект)
2. Введите имя проекта: **"Messenger"** (или любое другое)
3. *(Опционально)* Включите Google Analytics
4. Выберите аккаунт Analytics или создайте новый
5. Нажмите **"Create project"**
6. Дождитесь создания проекта (1-2 минуты)
7. Нажмите **"Continue"**

---

## 📱 Шаг 2: Настройка Android

### 2.1. Добавить Android приложение

1. В главном меню проекта нажмите значок **Android**
2. Заполните форму:
   - **Android package name:** `com.messengermobile`
   - **App nickname:** `Messenger Android` (опционально)
   - **Debug signing certificate SHA-1:** (опционально, для development)
3. Нажмите **"Register app"**

### 2.2. Скачать google-services.json

1. Нажмите **"Download google-services.json"**
2. Сохраните файл
3. Поместите файл в:
   ```
   mobile/android/app/google-services.json
   ```

### 2.3. Проверить build.gradle

Файл `android/build.gradle` должен содержать:

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

Файл `android/app/build.gradle` должен содержать:

```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

### 2.4. Пересобрать проект

```bash
cd android
./gradlew clean
cd ..
npm run android
```

---

## 🍎 Шаг 3: Настройка iOS (только macOS)

### 3.1. Добавить iOS приложение

1. В главном меню проекта нажмите значок **iOS**
2. Заполните форму:
   - **iOS bundle ID:** `com.messengermobile`
   - **App nickname:** `Messenger iOS` (опционально)
   - **App Store ID:** (пока оставить пустым)
3. Нажмите **"Register app"**

### 3.2. Скачать GoogleService-Info.plist

1. Нажмите **"Download GoogleService-Info.plist"**
2. Сохраните файл

### 3.3. Добавить файл в Xcode

1. Откройте проект в Xcode:
   ```bash
   cd ios
   open MessengerMobile.xcworkspace
   ```
2. Перетащите `GoogleService-Info.plist` в проект (в Xcode)
3. Убедитесь, что опция **"Copy items if needed"** включена
4. Убедитесь, что файл добавлен в target **MessengerMobile**

### 3.4. Установить CocoaPods dependencies

```bash
cd ios
pod install
cd ..
```

### 3.5. Настроить capabilities в Xcode

1. Откройте проект в Xcode
2. Выберите target **MessengerMobile**
3. Перейдите в **Signing & Capabilities**
4. Нажмите **"+ Capability"**
5. Добавьте:
   - **Push Notifications**
   - **Background Modes** (включите: Remote notifications, Background fetch, Voice over IP)

### 3.6. Пересобрать проект

```bash
npm run ios
```

---

## 🔑 Шаг 4: Получить Server Key (для Backend)

### 4.1. Найти Server Key

1. В Firebase Console перейдите в **Project Settings** (⚙️)
2. Перейдите на вкладку **"Cloud Messaging"**
3. Найдите раздел **"Cloud Messaging API (Legacy)"**
4. Скопируйте **"Server key"**

### 4.2. Сохранить в Backend

Добавьте в `.env` файл вашего backend:

```env
FIREBASE_SERVER_KEY=your_server_key_here
```

---

## 🧪 Шаг 5: Тестирование

### 5.1. Запустить приложение

```bash
# Android
npm run android

# iOS
npm run ios
```

### 5.2. Проверить получение FCM токена

При запуске приложения в логах должен появиться FCM токен:

```
FCM Token: dXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 5.3. Отправить тестовое уведомление

#### Способ 1: Через Firebase Console

1. В Firebase Console перейдите в **Cloud Messaging**
2. Нажмите **"Send your first message"**
3. Введите заголовок и текст
4. Нажмите **"Send test message"**
5. Вставьте FCM токен из логов
6. Нажмите **"Test"**

#### Способ 2: Через Backend API

```bash
curl -X POST http://localhost:3001/notifications/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test message"
  }'
```

### 5.4. Проверить получение уведомления

- **Foreground (приложение открыто):** Уведомление отображается в приложении
- **Background (приложение в фоне):** Системное уведомление
- **Quit (приложение закрыто):** Системное уведомление

---

## 🔧 Backend интеграция

### 6.1. Установить Firebase Admin SDK

```bash
cd backend
npm install firebase-admin
```

### 6.2. Создать сервис уведомлений

Файл: `backend/src/notifications/notifications.service.ts`

```typescript
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
  constructor() {
    // Инициализация Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }

  async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: any,
  ) {
    const message = {
      notification: {
        title,
        body,
      },
      data,
      token: fcmToken,
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('Successfully sent message:', response);
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
}
```

### 6.3. Сохранить FCM токен пользователя

Создайте endpoint для сохранения токена:

```typescript
@Post('fcm-token')
async saveFcmToken(
  @CurrentUser() user: User,
  @Body() dto: { token: string },
) {
  await this.usersService.updateFcmToken(user.id, dto.token);
  return { success: true };
}
```

### 6.4. Отправлять уведомления при новых сообщениях

```typescript
async sendMessage(dto: CreateMessageDto) {
  const message = await this.messagesService.create(dto);
  
  // Получить FCM токены получателей
  const recipients = await this.getRecipients(dto.chatId);
  
  // Отправить уведомления
  for (const recipient of recipients) {
    if (recipient.fcmToken) {
      await this.notificationsService.sendPushNotification(
        recipient.fcmToken,
        'Новое сообщение',
        message.content,
        { chatId: dto.chatId, messageId: message.id },
      );
    }
  }
  
  return message;
}
```

---

## 🐛 Troubleshooting

### Android: "Default FirebaseApp is not initialized"

**Решение:**

1. Проверьте, что `google-services.json` находится в `android/app/`
2. Проверьте, что в `android/app/build.gradle` есть:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```
3. Очистите и пересоберите:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npm run android
   ```

### iOS: "No Firebase App"

**Решение:**

1. Проверьте, что `GoogleService-Info.plist` добавлен в Xcode проект
2. Проверьте, что файл включён в target build phases
3. Переустановите pods:
   ```bash
   cd ios
   pod deintegrate
   pod install
   cd ..
   npm run ios
   ```

### Уведомления не приходят

**Проверьте:**

1. ✅ FCM токен получен и отображается в логах
2. ✅ Токен сохранён в базе данных
3. ✅ Backend имеет валидный Server Key
4. ✅ Приложение имеет разрешение на уведомления
5. ✅ Устройство подключено к интернету

**Android:**

```bash
adb logcat | grep FCM
```

**iOS:**

```bash
xcrun simctl spawn booted log stream --predicate 'processImagePath endswith "MessengerMobile"' | grep -i firebase
```

### Разрешение на уведомления не запрашивается

**Android:**

Проверьте `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

**iOS:**

1. Проверьте `Info.plist`:
   ```xml
   <key>NSUserNotificationsUsageDescription</key>
   <string>Messenger needs permission to send you notifications</string>
   ```
2. Проверьте capabilities в Xcode (Push Notifications должен быть включён)

---

## ✅ Checklist

### Android:
- [ ] Firebase проект создан
- [ ] Android app добавлен в Firebase
- [ ] `google-services.json` скачан
- [ ] `google-services.json` помещён в `android/app/`
- [ ] `build.gradle` настроены
- [ ] Приложение пересобрано
- [ ] FCM токен получен
- [ ] Тестовое уведомление получено

### iOS:
- [ ] iOS app добавлен в Firebase
- [ ] `GoogleService-Info.plist` скачан
- [ ] Файл добавлен в Xcode проект
- [ ] CocoaPods dependencies установлены
- [ ] Capabilities настроены (Push Notifications, Background Modes)
- [ ] Приложение пересобрано
- [ ] FCM токен получен
- [ ] Тестовое уведомление получено

### Backend:
- [ ] Firebase Admin SDK установлен
- [ ] Server Key сохранён в `.env`
- [ ] NotificationsService создан
- [ ] Endpoint для сохранения FCM токена создан
- [ ] Уведомления отправляются при новых сообщениях
- [ ] Тестовое уведомление работает

---

## 📚 Полезные ссылки

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase](https://rnfirebase.io/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

## 🎯 Следующие шаги

После успешной настройки Firebase:

1. ✅ **Тестирование** на реальных устройствах
2. ✅ **Фоновые уведомления** (когда приложение закрыто)
3. ✅ **Звук уведомлений** (кастомные рингтоны)
4. ✅ **Action buttons** (ответить, отклонить звонок)
5. ✅ **Grouped notifications** (группировка по чатам)
6. ✅ **Badge count** (счётчик непрочитанных на иконке)

---

**Версия:** 1.0  
**Дата:** 31 января 2026  
**Статус:** Готово к использованию ✅

**Успешной настройки! 🚀**
