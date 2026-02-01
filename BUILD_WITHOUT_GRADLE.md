# 🚀 СБОРКА APK БЕЗ СКАЧИВАНИЯ GRADLE

**Когда интернет нестабилен**

---

## ⚡ ВАРИАНТ 1: ИСПОЛЬЗОВАТЬ GRADLE ИЗ ANDROID STUDIO

Android Studio уже содержит Gradle! Используем его:

```powershell
cd c:\OSPanel\domains\Messager\mobile\android

# Найти Gradle в Android Studio
$gradlePath = "C:\Program Files\Android\Android Studio\gradle\gradle-8.2\bin\gradle.bat"

# Если есть - использовать его
if (Test-Path $gradlePath) {
    & $gradlePath assembleRelease
} else {
    Write-Host "Gradle not found in Android Studio"
}
```

---

## ⚡ ВАРИАНТ 2: СКАЧАТЬ GRADLE ВРУЧНУЮ (ЕСЛИ ИНТЕРНЕТ РАБОТАЕТ)

### Шаг 1: Скачайте Gradle вручную

**Ссылка:**
```
https://services.gradle.org/distributions/gradle-8.5-all.zip
```

**Или альтернативное зеркало:**
```
https://github.com/gradle/gradle/releases/download/v8.5.0/gradle-8.5-bin.zip
```

Сохраните в:
```
C:\Users\dsc-2\Downloads\gradle-8.5-all.zip
```

### Шаг 2: Скопируйте в кэш Gradle

```powershell
# Создать директорию
New-Item -ItemType Directory -Path "C:\Users\dsc-2\.gradle\wrapper\dists\gradle-8.5-all\3zlzzgtsutfj0pbojr50n2l7z" -Force

# Скопировать скачанный файл
Copy-Item "C:\Users\dsc-2\Downloads\gradle-8.5-all.zip" "C:\Users\dsc-2\.gradle\wrapper\dists\gradle-8.5-all\3zlzzgtsutfj0pbojr50n2l7z\gradle-8.5-all.zip"
```

### Шаг 3: Запустить сборку

```powershell
cd c:\OSPanel\domains\Messager\mobile\android
.\gradlew.bat assembleRelease
```

---

## ⚡ ВАРИАНТ 3: ИСПОЛЬЗОВАТЬ БОЛЕЕ СТАРУЮ ВЕРСИЮ GRADLE

Изменим на Gradle 7.6 (меньше размер):

```powershell
cd c:\OSPanel\domains\Messager\mobile\android\gradle\wrapper

# Изменить версию на 7.6
(Get-Content gradle-wrapper.properties) -replace 'gradle-8.5', 'gradle-7.6' | Set-Content gradle-wrapper.properties

cd ..\..
.\gradlew.bat assembleRelease
```

---

## ⚡ ВАРИАНТ 4: СОБРАТЬ ЧЕРЕЗ ANDROID STUDIO GUI

### Шаг 1: Откройте проект в Android Studio

1. Запустите **Android Studio**
2. **File** → **Open**
3. Выберите: `c:\OSPanel\domains\Messager\mobile\android`
4. Дождитесь синхронизации Gradle (автоматически)

### Шаг 2: Соберите APK

1. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Дождитесь окончания сборки
3. Нажмите **"locate"** в уведомлении

APK будет в:
```
c:\OSPanel\domains\Messager\mobile\android\app\build\outputs\apk\release\app-release.apk
```

---

## ⚡ ВАРИАНТ 5: УПРОЩЕННАЯ СБОРКА (БЕЗ GRADLE)

Если ничего не работает, создадим упрощенный APK:

```powershell
cd c:\OSPanel\domains\Messager\mobile

# Собрать JS bundle
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/

# Использовать Android SDK напрямую
cd android
"%ANDROID_HOME%\build-tools\34.0.0\aapt" package -f -m -J app\src\main\java -S app\src\main\res -M app\src\main\AndroidManifest.xml -I "%ANDROID_HOME%\platforms\android-34\android.jar"
```

---

## 📊 СТАТУС ИНТЕРНЕТА

Проверьте стабильность:

```powershell
# Проверить скорость
Test-Connection google.com -Count 4

# Проверить доступность Gradle
Test-NetConnection services.gradle.org -Port 443
```

---

## ✅ РЕКОМЕНДАЦИЯ:

**Если интернет нестабилен:**
1. Используйте **ВАРИАНТ 4** (Android Studio GUI) - самый надежный!
2. Gradle скачается автоматически через Android Studio

**Если интернет работает:**
1. Попробуйте **ВАРИАНТ 2** (скачать вручную)
2. Или **ВАРИАНТ 3** (Gradle 7.6)

---

**Начните с ВАРИАНТА 4 - откройте проект в Android Studio! 🚀**
