# 🚀 КОМАНДЫ ДЛЯ СБОРКИ APK

**После восстановления интернета выполните эти команды:**

---

## ✅ ВАРИАНТ 1: АВТОМАТИЧЕСКАЯ СБОРКА (РЕКОМЕНДУЕТСЯ)

### Откройте PowerShell и выполните:

```powershell
cd c:\OSPanel\domains\Messager

# Применить переменные окружения в текущей сессии
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME = 'C:\Users\dsc-2\AppData\Local\Android\Sdk'
$env:Path += ";C:\Program Files\Android\Android Studio\jbr\bin;C:\Users\dsc-2\AppData\Local\Android\Sdk\platform-tools"

# Собрать APK
cd mobile\android
.\gradlew.bat assembleRelease
```

**Время:** 10-15 минут (первый раз Gradle скачает зависимости ~200 MB)

---

## ✅ ВАРИАНТ 2: ЧЕРЕЗ REACT NATIVE CLI

```powershell
cd c:\OSPanel\domains\Messager\mobile
npx react-native build-android --mode=release
```

---

## 📊 ПРОВЕРИТЬ РЕЗУЛЬТАТ:

После успешной сборки APK будет здесь:

```
c:\OSPanel\domains\Messager\mobile\android\app\build\outputs\apk\release\app-release.apk
```

### Проверить наличие:

```powershell
Test-Path "c:\OSPanel\domains\Messager\mobile\android\app\build\outputs\apk\release\app-release.apk"
```

Должно вывести: **True**

---

## 🚀 ЗАГРУЗИТЬ НА СЕРВЕР:

```powershell
scp "c:\OSPanel\domains\Messager\mobile\android\app\build\outputs\apk\release\app-release.apk" root@89.169.39.244:/var/www/messenger/downloads/messenger-v1.0.0.apk
```

**Пароль:** (ваш SSH пароль для VPS)

---

## ✅ ПРОВЕРИТЬ НА СЕРВЕРЕ:

```bash
ssh root@89.169.39.244
ls -lh /var/www/messenger/downloads/
```

Должен показать файл `messenger-v1.0.0.apk`

---

## 🌐 СКАЧАТЬ APK:

После загрузки APK будет доступен по адресу:

```
http://89.169.39.244/downloads/messenger-v1.0.0.apk
```

---

## ❌ ЕСЛИ ОШИБКИ ПРИ СБОРКЕ:

### 1. Очистить кэш Gradle:

```powershell
cd c:\OSPanel\domains\Messager\mobile\android
.\gradlew.bat clean
.\gradlew.bat assembleRelease
```

### 2. Переустановить node_modules:

```powershell
cd c:\OSPanel\domains\Messager\mobile
rm -r node_modules
npm install --legacy-peer-deps
```

### 3. Проверить Java и Android SDK:

```powershell
java -version
echo $env:JAVA_HOME
echo $env:ANDROID_HOME
```

Всё должно выводить корректные значения!

---

## 📋 ФИНАЛЬНЫЙ ЧЕКЛИСТ:

- [ ] Интернет восстановлен
- [ ] Выполнил команду `.\gradlew.bat assembleRelease`
- [ ] APK собран успешно
- [ ] APK загружен на сервер
- [ ] APK доступен по ссылке

---

**НАЧИНАЙТЕ С ВАРИАНТА 1! 🚀**
