# 📱 УСТАНОВКА ANDROID SDK И СБОРКА APK

**Дата:** 31 января 2026  
**Цель:** Установить все необходимое и собрать APK

---

## 📋 ЧТО НУЖНО УСТАНОВИТЬ:

1. ☑️ Java JDK 17+
2. ☑️ Android Studio
3. ☑️ Android SDK (через Android Studio)
4. ☑️ Переменные окружения

**Время:** 30-60 минут

---

## 🔧 ШАГ 1: УСТАНОВКА JAVA JDK

### Скачать Java 17:

**Ссылка:** https://www.oracle.com/java/technologies/downloads/#jdk17-windows

**Или Adoptium (рекомендуется):**
https://adoptium.net/temurin/releases/?version=17

### Установить:

1. Скачайте **jdk-17_windows-x64_bin.msi**
2. Запустите установщик
3. Следуйте инструкциям (оставьте путь по умолчанию)
4. Установка в: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot\`

### Проверить установку:

```powershell
java -version
```

Должно показать:
```
openjdk version "17.0.x"
```

---

## 🎨 ШАГ 2: УСТАНОВКА ANDROID STUDIO

### Скачать Android Studio:

**Ссылка:** https://developer.android.com/studio

**Размер:** ~1 GB  
**Время скачивания:** 5-15 минут

### Установить:

1. Запустите **android-studio-xxx-windows.exe**
2. Выберите "Standard" installation
3. Согласитесь с установкой:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device

**Путь установки SDK (по умолчанию):**
```
C:\Users\dsc-2\AppData\Local\Android\Sdk
```

### Компоненты для установки:

Откройте **SDK Manager** в Android Studio:

1. **SDK Platforms:**
   - ✅ Android 14.0 (API 34) - рекомендуется
   - ✅ Android 13.0 (API 33)

2. **SDK Tools:**
   - ✅ Android SDK Build-Tools 34.0.0
   - ✅ Android SDK Command-line Tools
   - ✅ Android SDK Platform-Tools
   - ✅ Android Emulator (опционально)

**Размер:** ~3-5 GB

---

## 🌍 ШАГ 3: НАСТРОЙКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ

### Открыть PowerShell от имени администратора:

```powershell
# Установить ANDROID_HOME
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\dsc-2\AppData\Local\Android\Sdk', 'User')

# Установить JAVA_HOME (если нужно)
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.0.13.11-hotspot', 'User')

# Добавить в PATH
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$newPaths = @(
    'C:\Users\dsc-2\AppData\Local\Android\Sdk\platform-tools',
    'C:\Users\dsc-2\AppData\Local\Android\Sdk\tools',
    'C:\Users\dsc-2\AppData\Local\Android\Sdk\tools\bin',
    'C:\Program Files\Eclipse Adoptium\jdk-17.0.13.11-hotspot\bin'
)

foreach ($path in $newPaths) {
    if ($currentPath -notlike "*$path*") {
        $currentPath += ";$path"
    }
}

[System.Environment]::SetEnvironmentVariable('Path', $currentPath, 'User')
```

### Перезапустить PowerShell!

### Проверить:

```powershell
echo $env:ANDROID_HOME
java -version
adb version
```

---

## 📦 ШАГ 4: УСТАНОВКА ЗАВИСИМОСТЕЙ REACT NATIVE

```powershell
cd c:\OSPanel\domains\Messager\mobile
npm install
```

**Время:** 10-15 минут (много нативных модулей)

**Если появляются ошибки:**

```powershell
# Очистить кэш
npm cache clean --force
rm -r node_modules
rm package-lock.json
npm install --legacy-peer-deps
```

---

## 🔑 ШАГ 5: СОЗДАНИЕ KEYSTORE

### Создать signing key:

```powershell
cd c:\OSPanel\domains\Messager\mobile\android\app

keytool -genkey -v -keystore messenger-release.keystore -alias messenger-key -keyalg RSA -keysize 2048 -validity 10000
```

**При запросе введите:**
- **Пароль keystore:** `messenger2026` (запомните!)
- **Пароль ключа:** `messenger2026` (тот же)
- **Имя и фамилия:** Messenger Team
- **Название организации:** Messenger
- **Город:** Moscow
- **Область:** Moscow
- **Код страны:** RU

### Настроить gradle.properties:

Создайте файл `android/gradle.properties`:

```properties
MYAPP_UPLOAD_STORE_FILE=messenger-release.keystore
MYAPP_UPLOAD_KEY_ALIAS=messenger-key
MYAPP_UPLOAD_STORE_PASSWORD=messenger2026
MYAPP_UPLOAD_KEY_PASSWORD=messenger2026

android.useAndroidX=true
android.enableJetifier=true
```

---

## 🏗️ ШАГ 6: НАСТРОЙКА BUILD.GRADLE

Убедитесь что `android/app/build.gradle` содержит:

```gradle
android {
    ...
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
            minifyEnabled false
            shrinkResources false
        }
    }
}
```

---

## 🚀 ШАГ 7: СБОРКА APK

### Проверить что gradle wrapper существует:

```powershell
cd c:\OSPanel\domains\Messager\mobile\android
ls gradlew*
```

**Если нет gradlew:**

```powershell
# Инициализировать gradle wrapper
gradle wrapper
```

### Собрать Release APK:

```powershell
cd c:\OSPanel\domains\Messager\mobile\android
.\gradlew assembleRelease
```

**Время:** 5-10 минут (первая сборка)

**APK будет здесь:**
```
mobile\android\app\build\outputs\apk\release\app-release.apk
```

**Размер:** ~20-30 MB

---

## 📤 ШАГ 8: ЗАГРУЗКА НА СЕРВЕР

```powershell
cd c:\OSPanel\domains\Messager

scp mobile\android\app\build\outputs\apk\release\app-release.apk root@89.169.39.244:/var/www/messenger/downloads/messenger-v1.0.0.apk
```

**Проверить:**
```powershell
ssh root@89.169.39.244 "ls -lh /var/www/messenger/downloads/"
```

---

## 🌐 ШАГ 9: ОБНОВЛЕНИЕ СТРАНИЦЫ СКАЧИВАНИЯ

Вернуть кнопку скачивания в `download.html`:

```html
<a href="/downloads/messenger-v1.0.0.apk" class="download-btn" download>
    📥 Скачать для Android
</a>
```

**Проверить:**
```
http://89.169.39.244/download.html
http://89.169.39.244/downloads/messenger-v1.0.0.apk
```

---

## ✅ ПРОВЕРКА РАБОТЫ:

1. **Открыть на Android телефоне:**
   ```
   http://89.169.39.244/download.html
   ```

2. **Скачать APK**

3. **Разрешить установку из неизвестных источников**

4. **Установить**

5. **Запустить и протестировать!**

---

## 🐛 TROUBLESHOOTING:

### Ошибка: "SDK location not found"

**Решение:**

Создайте файл `android/local.properties`:

```properties
sdk.dir=C:\\Users\\dsc-2\\AppData\\Local\\Android\\Sdk
```

### Ошибка: "Execution failed for task ':app:mergeReleaseResources'"

**Решение:**

```powershell
cd android
.\gradlew clean
.\gradlew assembleRelease
```

### Ошибка: нативные модули не компилируются

**Решение:** Упростить `package.json`, убрать проблемные зависимости:

```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.73.2",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "axios": "^1.6.5",
    "socket.io-client": "^4.6.1",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "react-native-vector-icons": "^10.0.3"
  }
}
```

Затем:
```powershell
rm -r node_modules
npm install
cd android
.\gradlew assembleRelease
```

---

## 📊 ИТОГОВЫЙ CHECKLIST:

- [ ] Java JDK 17 установлена
- [ ] Android Studio установлена
- [ ] Android SDK установлен (API 34)
- [ ] Переменные окружения настроены
- [ ] `npm install` выполнен успешно
- [ ] Keystore создан
- [ ] gradle.properties настроен
- [ ] APK собран
- [ ] APK загружен на сервер
- [ ] Страница download.html обновлена
- [ ] APK протестирован на телефоне

---

## 🎯 ВРЕМЯ НА ВЫПОЛНЕНИЕ:

- Скачивание: 15-30 мин
- Установка: 15-30 мин
- Настройка: 10-15 мин
- Сборка: 15-20 мин

**Итого:** 60-90 минут

---

## 💡 БЫСТРЫЙ СТАРТ:

Если хотите быстрее:

1. Скачайте Android Studio: https://developer.android.com/studio
2. Установите (Standard setup)
3. Запустите скрипт настройки (создам далее)
4. Соберите APK одной командой

**Или используйте Expo EAS Build** (сборка в облаке, 15 минут):

```powershell
cd mobile
npx eas build --platform android
```

Выбирайте удобный вариант! 🚀
