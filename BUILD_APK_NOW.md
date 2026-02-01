# 📱 СБОРКА APK - ПОШАГОВАЯ ИНСТРУКЦИЯ

**Дата:** 31 января 2026  
**Цель:** Собрать signed APK для Android

---

## ⚠️ ТРЕБОВАНИЯ:

1. **Node.js** 18+ (✅ установлен)
2. **Java JDK** 17+ 
3. **Android SDK** (Android Studio или command-line tools)
4. **Время:** 30-60 минут

---

## 🚀 БЫСТРЫЙ СПОСОБ (РЕКОМЕНДУЕТСЯ):

###Используйте Expo или EAS Build

```bash
cd c:\OSPanel\domains\Messager\mobile
npx expo init messenger-mobile --template blank-typescript
# Скопировать src/, package.json
npx eas build --platform android
```

**Преимущества:**
- Не нужен Android SDK локально
- Сборка в облаке
- Готовый APK за 10-15 минут

---

## 📋 РУЧНАЯ СБОРКА (ПОЛНЫЙ КОНТРОЛЬ):

### Шаг 1: Установить Android Studio

**Скачать:** https://developer.android.com/studio

1. Установите Android Studio
2. Откройте SDK Manager
3. Установите:
   - Android SDK Platform 34
   - Android SDK Build-Tools 34.0.0
   - Android SDK Command-line Tools

### Шаг 2: Настроить переменные окружения

**Windows (PowerShell):**

```powershell
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\dsc-2\AppData\Local\Android\Sdk', 'User')
[System.Environment]::SetEnvironmentVariable('PATH', $env:PATH + ';C:\Users\dsc-2\AppData\Local\Android\Sdk\platform-tools', 'User')
```

**Перезапустите PowerShell!**

### Шаг 3: Установить зависимости

```bash
cd c:\OSPanel\domains\Messager\mobile
npm install
```

**Время:** 10-15 минут (много нативных модулей)

### Шаг 4: Создать keystore

```bash
keytool -genkey -v -keystore messenger-release.keystore -alias messenger-key -keyalg RSA -keysize 2048 -validity 10000
```

**Запомните пароль!** Например: `messenger2026`

### Шаг 5: Настроить gradle

Создайте файл `android/gradle.properties`:

```properties
MYAPP_UPLOAD_STORE_FILE=messenger-release.keystore
MYAPP_UPLOAD_KEY_ALIAS=messenger-key
MYAPP_UPLOAD_STORE_PASSWORD=messenger2026
MYAPP_UPLOAD_KEY_PASSWORD=messenger2026
```

### Шаг 6: Обновить build.gradle

Добавьте в `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Шаг 7: Собрать APK

```bash
cd android
./gradlew assembleRelease
```

**Или (если gradlew не работает):**

```bash
npx react-native run-android --variant=release
```

**APK будет здесь:**
```
mobile/android/app/build/outputs/apk/release/app-release.apk
```

### Шаг 8: Загрузить на сервер

```bash
scp mobile/android/app/build/outputs/apk/release/app-release.apk root@89.169.39.244:/var/www/messenger/downloads/messenger-v1.0.0.apk
```

### Шаг 9: Обновить страницу download.html

Вернуть кнопку скачивания APK (она уже настроена в Nginx).

---

## 🐛 TROUBLESHOOTING:

### Ошибка: "gradlew not found"

**Решение:** Инициализировать Android проект:

```bash
cd mobile
npx react-native init TempProject
cp -r TempProject/android/gradle* android/
rm -rf TempProject
```

### Ошибка: "SDK not found"

**Решение:** Установить Android SDK через Android Studio или:

```bash
npx react-native doctor
```

### Ошибка: "Could not find com.android.tools.build:gradle"

**Решение:** Обновить `android/build.gradle`:

```gradle
buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 24
        compileSdkVersion = 34
        targetSdkVersion = 34
    }
    dependencies {
        classpath('com.android.tools.build:gradle:8.1.1')
    }
}
```

### Ошибка: нативные модули не компилируются

**Решение:** Удалить проблемные зависимости:

1. Закомментировать в `package.json`:
   - `react-native-webrtc`
   - `react-native-background-actions`
   - `@react-native-firebase/app`

2. Пересобрать:
   ```bash
   rm -rf node_modules
   npm install
   cd android && ./gradlew assembleRelease
   ```

---

## ⚡ АЛЬТЕРНАТИВА: Упрощенный APK

Создайте минимальный APK **без** нативных модулей:

### 1. Упрощенный package.json:

```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.73.2",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "axios": "^1.6.5",
    "socket.io-client": "^4.6.1"
  }
}
```

### 2. Собрать:

```bash
cd mobile
rm -rf node_modules
npm install
cd android && ./gradlew assembleRelease
```

**Размер APK:** ~15 MB (вместо ~50 MB)

**Функции:** Базовые (текст, чаты, без звонков/push)

---

## 📊 СРАВНЕНИЕ МЕТОДОВ:

| Метод | Время | Сложность | Результат |
|-------|-------|-----------|-----------|
| **Expo/EAS** | 15 мин | Низкая | APK в облаке |
| **Ручная сборка** | 60 мин | Высокая | Полный контроль |
| **Упрощенный APK** | 30 мин | Средняя | Базовый функционал |
| **Веб-версия (PWA)** | 0 мин | Нулевая | Уже работает! |

---

## 💡 РЕКОМЕНДАЦИЯ:

**Для быстрого запуска:**
- ✅ Используйте **веб-версию** (уже работает отлично!)
- ✅ Пользователи добавляют на главный экран
- ✅ Работает как приложение

**Для полноценного APK:**
- 🔧 Выделите время на setup Android SDK
- 🔧 Используйте Expo/EAS для облачной сборки
- 🔧 Или соберите упрощенную версию без WebRTC

---

## 🎯 СЛЕДУЮЩИЕ ШАГИ:

1. **Сейчас:** Пользователи используют веб-версию http://89.169.39.244
2. **На неделе:** Настроить Android SDK + собрать APK
3. **Через неделю:** Опубликовать в Google Play

---

**Веб-версия уже полностью функциональна!** 🚀

**APK - это дополнение, но не обязательно для старта!**
