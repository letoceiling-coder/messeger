# 📦 Руководство по сборке APK

Пошаговая инструкция по созданию подписанного APK файла для Android.

---

## 📋 Предварительные требования

- ✅ Android Studio установлен
- ✅ JDK 17 установлен
- ✅ Проект работает на эмуляторе/устройстве
- ✅ Firebase настроен (опционально)

---

## 🔑 Шаг 1: Создание ключа подписи

### 1.1. Генерация keystore

```bash
cd android/app

# Windows
keytool -genkeypair -v -storetype PKCS12 -keystore messenger-release.keystore -alias messenger-key -keyalg RSA -keysize 2048 -validity 10000

# macOS/Linux
keytool -genkeypair -v -storetype PKCS12 -keystore messenger-release.keystore -alias messenger-key -keyalg RSA -keysize 2048 -validity 10000
```

### 1.2. Заполнить данные

При запросе введите:

```
Enter keystore password: [ваш_пароль]
Re-enter new password: [ваш_пароль]

What is your first and last name?
  [Unknown]:  Your Name

What is the name of your organizational unit?
  [Unknown]:  Development

What is the name of your organization?
  [Unknown]:  Your Company

What is the name of your City or Locality?
  [Unknown]:  Your City

What is the name of your State or Province?
  [Unknown]:  Your State

What is the two-letter country code for this unit?
  [Unknown]:  US

Is CN=Your Name, OU=Development, O=Your Company, L=Your City, ST=Your State, C=US correct?
  [no]:  yes
```

### 1.3. Сохранить пароли

**ВАЖНО:** Сохраните эти данные в надёжном месте!

- **Keystore password:** [ваш_пароль]
- **Key alias:** messenger-key
- **Key password:** [ваш_пароль]

Файл `messenger-release.keystore` будет создан в `android/app/`

---

## ⚙️ Шаг 2: Настройка gradle

### 2.1. Создать gradle.properties

Создайте или отредактируйте файл:  
`android/gradle.properties`

Добавьте:

```properties
MESSENGER_UPLOAD_STORE_FILE=messenger-release.keystore
MESSENGER_UPLOAD_KEY_ALIAS=messenger-key
MESSENGER_UPLOAD_STORE_PASSWORD=your_keystore_password
MESSENGER_UPLOAD_KEY_PASSWORD=your_key_password

# Включить ProGuard (минимизация кода)
android.enableProguardInReleaseBuilds=true

# Включить R8 (оптимизация)
android.enableR8=true

# Увеличить память для gradle
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=512m
```

**Замените:**
- `your_keystore_password` → ваш пароль keystore
- `your_key_password` → ваш пароль ключа

### 2.2. Проверить build.gradle

Файл `android/app/build.gradle` должен содержать:

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MESSENGER_UPLOAD_STORE_FILE')) {
                storeFile file(MESSENGER_UPLOAD_STORE_FILE)
                storePassword MESSENGER_UPLOAD_STORE_PASSWORD
                keyAlias MESSENGER_UPLOAD_KEY_ALIAS
                keyPassword MESSENGER_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
```

---

## 🏗️ Шаг 3: Сборка APK

### 3.1. Очистить предыдущие сборки

```bash
cd android
./gradlew clean
cd ..
```

### 3.2. Собрать release APK

```bash
cd android
./gradlew assembleRelease
```

**Это займёт 3-10 минут** в зависимости от вашего компьютера.

### 3.3. Найти APK

После успешной сборки APK будет находиться:

```
android/app/build/outputs/apk/release/app-release.apk
```

### 3.4. Размер APK

Первая сборка обычно получается большой (~40-60 MB).  
Для уменьшения размера см. раздел "Оптимизация".

---

## 📱 Шаг 4: Установка APK

### 4.1. На эмулятор

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### 4.2. На реальное устройство

#### Через USB:

1. Подключить устройство через USB
2. Включить **USB Debugging** (см. SETUP_GUIDE.md)
3. Запустить:
   ```bash
   adb devices
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

#### Через файл:

1. Скопировать APK на устройство (email, USB, облако)
2. На устройстве открыть файл
3. Разрешить установку из неизвестных источников (если запросит)
4. Установить

---

## 🔒 Шаг 5: Создание AAB (для Google Play)

Android App Bundle (AAB) — современный формат для Google Play.

### 5.1. Собрать AAB

```bash
cd android
./gradlew bundleRelease
```

### 5.2. Найти AAB

```
android/app/build/outputs/bundle/release/app-release.aab
```

### 5.3. Загрузить в Google Play Console

1. Перейти в [Google Play Console](https://play.google.com/console)
2. Создать приложение
3. Перейти в **Production → Create new release**
4. Загрузить `app-release.aab`
5. Заполнить описание и скриншоты
6. Отправить на ревью

---

## 🎨 Шаг 6: Настройка иконки и splash screen

### 6.1. Иконка приложения

Создайте иконки всех размеров:

```
android/app/src/main/res/
├── mipmap-hdpi/ic_launcher.png (72x72)
├── mipmap-mdpi/ic_launcher.png (48x48)
├── mipmap-xhdpi/ic_launcher.png (96x96)
├── mipmap-xxhdpi/ic_launcher.png (144x144)
└── mipmap-xxxhdpi/ic_launcher.png (192x192)
```

**Инструменты:**
- [App Icon Generator](https://appicon.co/)
- [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/)

### 6.2. Splash Screen

Создайте файл:  
`android/app/src/main/res/drawable/splash_background.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/splash_background"/>
    <item>
        <bitmap
            android:gravity="center"
            android:src="@drawable/splash_logo"/>
    </item>
</layer-list>
```

Добавьте в `android/app/src/main/res/values/colors.xml`:

```xml
<resources>
    <color name="splash_background">#0B0B0B</color>
</resources>
```

---

## ⚡ Шаг 7: Оптимизация размера APK

### 7.1. Включить ProGuard

В `android/app/build.gradle`:

```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
    }
}
```

### 7.2. Включить splits (по архитектуре)

В `android/app/build.gradle`:

```gradle
splits {
    abi {
        reset()
        enable true
        universalApk false
        include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
    }
}
```

Это создаст отдельные APK для каждой архитектуры:
- `app-armeabi-v7a-release.apk` (~20 MB)
- `app-arm64-v8a-release.apk` (~25 MB)
- `app-x86-release.apk` (~25 MB)
- `app-x86_64-release.apk` (~30 MB)

### 7.3. Использовать Hermes

Hermes — JavaScript движок от Facebook, ускоряет загрузку.

В `android/app/build.gradle`:

```gradle
project.ext.react = [
    enableHermes: true
]
```

### 7.4. Результат оптимизации

До оптимизации: **~40-60 MB**  
После оптимизации: **~15-25 MB** (per ABI)

---

## 🧪 Шаг 8: Тестирование

### 8.1. Проверить функции

- ✅ Вход/регистрация
- ✅ Отправка сообщений
- ✅ Real-time обновления
- ✅ Push уведомления
- ✅ Загрузка медиа (фото, видео)
- ✅ Голосовые сообщения
- ✅ Звонки (WebRTC)

### 8.2. Проверить производительность

```bash
# Установить профилированную сборку
./gradlew installRelease

# Запустить профилирование
adb shell am start -n com.messengermobile/.MainActivity --profile-auto-stop
```

### 8.3. Проверить crashlytics

Установите Firebase Crashlytics для отслеживания ошибок:

```bash
npm install @react-native-firebase/crashlytics
```

---

## 🚀 Шаг 9: Публикация

### 9.1. Подготовить материалы

- **Скриншоты** (минимум 2, рекомендуется 8)
- **Feature Graphic** (1024x500)
- **Иконка** (512x512)
- **Описание** (до 4000 символов)
- **Краткое описание** (до 80 символов)

### 9.2. Создать аккаунт разработчика

1. Перейти в [Google Play Console](https://play.google.com/console)
2. Зарегистрироваться ($25 одноразовый платёж)
3. Заполнить информацию о разработчике

### 9.3. Создать приложение

1. **Create app**
2. Заполнить основную информацию
3. Загрузить AAB
4. Настроить ценообразование (бесплатно/платно)
5. Заполнить контент-рейтинг
6. Согласиться с правилами
7. Отправить на ревью

### 9.4. Время ревью

- **Первая публикация:** 1-7 дней
- **Обновления:** обычно 1-2 дня

---

## 📊 Checklist перед публикацией

### Технические:
- [ ] APK/AAB собраны и подписаны
- [ ] Протестировано на нескольких устройствах
- [ ] Push уведомления работают
- [ ] Все разрешения настроены
- [ ] ProGuard rules настроены
- [ ] Crashlytics подключён
- [ ] Размер APK оптимизирован

### Материалы:
- [ ] Скриншоты готовы (8 шт)
- [ ] Feature graphic создан
- [ ] Иконка 512x512 готова
- [ ] Описание написано
- [ ] Краткое описание написано
- [ ] Privacy Policy опубликована
- [ ] Контакты указаны

### Магазин:
- [ ] Google Play аккаунт создан
- [ ] Приложение создано
- [ ] AAB загружен
- [ ] Контент-рейтинг заполнен
- [ ] Ценообразование настроено
- [ ] Отправлено на ревью

---

## 🐛 Troubleshooting

### Ошибка: "Failed to install"

**Решение:**

1. Удалить старую версию:
   ```bash
   adb uninstall com.messengermobile
   ```
2. Установить заново

### Ошибка: "Keystore was tampered with"

**Решение:**

Пароль введён неправильно. Проверьте:
- Keystore password
- Key password

### Ошибка: "Unsigned APK"

**Решение:**

Проверьте `gradle.properties`:
- Все переменные `MESSENGER_UPLOAD_*` заполнены
- Keystore file существует в `android/app/`

### APK слишком большой

**Решение:**

1. Включить ProGuard (см. "Оптимизация")
2. Использовать ABI splits
3. Включить Hermes
4. Удалить неиспользуемые ресурсы

### Crash при запуске release версии

**Решение:**

Проверьте ProGuard rules:

`android/app/proguard-rules.pro`:

```
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.swmansion.** { *; }
-dontwarn com.facebook.react.**
```

---

## 📚 Полезные ссылки

- [Android Signing Docs](https://developer.android.com/studio/publish/app-signing)
- [Google Play Console](https://play.google.com/console)
- [ProGuard Rules](https://www.guardsquare.com/manual/configuration)
- [App Size Optimization](https://developer.android.com/topic/performance/reduce-apk-size)

---

## 🎯 Следующие шаги

После успешной сборки APK:

1. ✅ Протестировать на реальных устройствах
2. ✅ Собрать AAB для Google Play
3. ✅ Создать скриншоты и графику
4. ✅ Написать описание
5. ✅ Опубликовать в Google Play

Для iOS сборки см. `BUILD_IPA_GUIDE.md` (на macOS).

---

**Версия:** 1.0  
**Дата:** 31 января 2026  
**Статус:** Готово к использованию ✅

**Успешной сборки! 📦🚀**
