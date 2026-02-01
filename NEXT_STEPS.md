# 🎯 ЧТО ДЕЛАТЬ ДАЛЬШЕ - СЛЕДУЮЩИЕ ШАГИ

**Вы установили Java и Android Studio! ✅**

---

## 📋 CHECKLIST:

- [x] Java JDK 17 установлена
- [x] Android Studio установлен
- [ ] Android SDK установлен (через Android Studio)
- [ ] Переменные окружения настроены
- [ ] React Native зависимости установлены
- [ ] Keystore создан
- [ ] APK собран
- [ ] APK загружен на сервер

---

## 🚀 ШАГ 1: УСТАНОВИТЬ ANDROID SDK

### Откройте Android Studio:

1. Запустите **Android Studio**
2. Если это первый запуск, следуйте Setup Wizard
3. Нажмите **"More Actions"** → **"SDK Manager"**

### Установите компоненты:

**SDK Platforms** (вкладка):
- ✅ Android 14.0 (API 34)
- ✅ Android 13.0 (API 33)

**SDK Tools** (вкладка):
- ✅ Android SDK Build-Tools 34.0.0
- ✅ Android SDK Command-line Tools
- ✅ Android SDK Platform-Tools

4. Нажмите **"Apply"**
5. Дождитесь скачивания (~3-5 GB)

**Запомните путь "Android SDK Location"** (вверху окна)!

**Обычно это:**
```
C:\Users\dsc-2\AppData\Local\Android\Sdk
```

---

## 🔧 ШАГ 2: НАСТРОИТЬ ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ

### Вариант A: Автоматически (PowerShell от имени Администратора)

```powershell
cd c:\OSPanel\domains\Messager
.\scripts\find-and-setup.ps1
```

### Вариант B: Вручную (через GUI)

См. файл: **`QUICK_SETUP.md`** или **`SETUP_ENV_MANUAL.md`**

**Нужно настроить:**
- `JAVA_HOME` → Путь к JDK
- `ANDROID_HOME` → Путь к Android SDK
- `Path` → Добавить bin директории

### После настройки:

**Перезапустите PowerShell!** (ВАЖНО!)

### Проверка:

```powershell
java -version
echo $env:ANDROID_HOME
adb version
```

Всё должно показать версии!

---

## 📦 ШАГ 3: УСТАНОВИТЬ ЗАВИСИМОСТИ

```powershell
cd c:\OSPanel\domains\Messager\mobile
npm install
```

**Время:** 10-15 минут

**Если ошибки:**
```powershell
npm install --legacy-peer-deps
```

---

## 🔑 ШАГ 4: СОЗДАТЬ KEYSTORE

```powershell
cd c:\OSPanel\domains\Messager\mobile\android\app

keytool -genkey -v -keystore messenger-release.keystore -alias messenger-key -keyalg RSA -keysize 2048 -validity 10000
```

**Пароль:** `messenger2026` (запомните!)

---

## 🏗️ ШАГ 5: НАСТРОИТЬ GRADLE

Создайте файл `mobile\android\gradle.properties`:

```properties
MYAPP_UPLOAD_STORE_FILE=messenger-release.keystore
MYAPP_UPLOAD_KEY_ALIAS=messenger-key
MYAPP_UPLOAD_STORE_PASSWORD=messenger2026
MYAPP_UPLOAD_KEY_PASSWORD=messenger2026

android.useAndroidX=true
android.enableJetifier=true
```

---

## 🚀 ШАГ 6: СОБРАТЬ APK

```powershell
cd c:\OSPanel\domains\Messager
.\scripts\build-apk.ps1 -Upload
```

**Время:** 10-15 минут

**APK автоматически загрузится на сервер!**

---

## ✅ ГОТОВО!

APK будет доступен:
```
http://89.169.39.244/downloads/messenger-v1.0.0.apk
```

---

## 📊 ТЕКУЩИЙ СТАТУС:

| Шаг | Статус | Время |
|-----|--------|-------|
| Java | ✅ Установлена | 5 мин |
| Android Studio | ✅ Установлен | 20 мин |
| Android SDK | ⏳ Следующее | 10 мин |
| Переменные окружения | ⏳ Следующее | 3 мин |
| npm install | ⏳ Ожидает | 15 мин |
| Keystore | ⏳ Ожидает | 2 мин |
| Сборка APK | ⏳ Ожидает | 15 мин |

**Осталось:** ~45 минут

---

## 🎯 НАЧНИТЕ С:

1. **Откройте Android Studio** → установите SDK
2. **Запустите:** `.\scripts\find-and-setup.ps1` (от имени Администратора)
3. **Перезапустите PowerShell**
4. **Соберите APK:** `.\scripts\build-apk.ps1 -Upload`

---

**Продолжайте! 🚀**
