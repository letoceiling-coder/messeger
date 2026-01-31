# Установка приложения Messager

Документ с ссылками для установки мобильных приложений Messager на Android и iOS.

---

## Android

### Установка APK (для тестирования)

**Прямая ссылка на скачивание APK:**
```
https://ваш-домен.com/downloads/messager-latest.apk
```

**Инструкция по установке:**
1. Скачайте файл `messager-latest.apk` на Android-устройство
2. Откройте файл и разрешите установку из неизвестных источников (если требуется)
3. Следуйте инструкциям на экране

**Альтернатива — QR-код:**
```
[Здесь будет QR-код для быстрой установки]
```

### Google Play (после публикации)

**Ссылка на Google Play:**
```
https://play.google.com/store/apps/details?id=com.messager.app
```

---

## iOS

### TestFlight (для тестирования)

**Ссылка на TestFlight:**
```
https://testflight.apple.com/join/XXXXXX
```

**Инструкция:**
1. Установите приложение TestFlight из App Store (если ещё не установлено)
2. Откройте ссылку выше на iOS-устройстве
3. Нажмите «Принять приглашение» и установите приложение

### App Store (после публикации)

**Ссылка на App Store:**
```
https://apps.apple.com/app/messager/idXXXXXXXXX
```

---

## Как получить файлы для установки

### Для разработчиков

**Android APK** создаётся командой:
```bash
cd mobile
eas build --platform android --profile preview
```

После сборки EAS предоставит ссылку для скачивания APK. Загрузите файл и разместите на сервере в папке `public/downloads/` для публичного доступа.

**iOS TestFlight** настраивается через:
```bash
cd mobile
eas build --platform ios --profile preview
eas submit --platform ios
```

После загрузки в App Store Connect добавьте тестеров в TestFlight и получите ссылку приглашения.

---

## Обновление ссылок

После создания сборок и публикации в магазинах обновите ссылки выше на актуальные.

**Дата обновления:** [Дата первого релиза]  
**Версия:** 1.0.0
