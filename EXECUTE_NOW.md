# ⚡ ВЫПОЛНИТЕ ПРЯМО СЕЙЧАС

**Копируйте и выполняйте команды по порядку**

---

## 🚀 ШАГ 1: ДЕПЛОЙ НА VPS (15 минут)

### Откройте Git Bash

**Windows:** Нажмите правую кнопку мыши в папке проекта → **Git Bash Here**

### Выполните команды:

```bash
# Перейти в проект
cd /c/OSPanel/domains/Messager

# Сделать скрипт исполняемым
chmod +x scripts/deploy-full-production.sh

# Запустить деплой
./scripts/deploy-full-production.sh
```

**Введите пароль для root@89.169.39.244 когда попросит**

### Ожидайте 10-15 минут...

Скрипт выполнит:
- ✅ Загрузку кода на сервер
- ✅ Установку зависимостей
- ✅ Настройку MySQL
- ✅ Сборку frontend
- ✅ Настройку nginx
- ✅ Запуск backend

### После завершения проверьте:

Откройте в браузере:
```
http://89.169.39.244
```

Если сайт открылся → **деплой успешен!** ✅

---

## 📱 ШАГ 2: СБОРКА APK (30 минут)

### А. Создать keystore (один раз)

Откройте **PowerShell** или **Command Prompt**:

```powershell
cd c:\OSPanel\domains\Messager\mobile\android\app

keytool -genkeypair -v -storetype PKCS12 -keystore messenger-release.keystore -alias messenger-key -keyalg RSA -keysize 2048 -validity 10000
```

**Заполните данные:**
- Password: `Test123456` (запомните!)
- Re-enter: `Test123456`
- Name: `Your Name`
- Unit: `Dev`
- Organization: `Your Company`
- City, State, Country: любые
- Confirm: `yes`

### Б. Настроить gradle.properties

**Откройте файл:**
```
c:\OSPanel\domains\Messager\mobile\android\gradle.properties
```

**Добавьте (если нет):**
```properties
MESSENGER_UPLOAD_STORE_FILE=messenger-release.keystore
MESSENGER_UPLOAD_KEY_ALIAS=messenger-key
MESSENGER_UPLOAD_STORE_PASSWORD=Test123456
MESSENGER_UPLOAD_KEY_PASSWORD=Test123456

android.enableProguardInReleaseBuilds=true
android.enableR8=true
```

### В. Собрать APK

В PowerShell:

```powershell
cd c:\OSPanel\domains\Messager\mobile\android

# Очистить
.\gradlew clean

# Собрать
.\gradlew assembleRelease
```

**Ожидайте 5-10 минут...**

### APK будет здесь:
```
c:\OSPanel\domains\Messager\mobile\android\app\build\outputs\apk\release\app-release.apk
```

---

## 📤 ШАГ 3: ЗАГРУЗКА APK НА СЕРВЕР (5 минут)

### В Git Bash:

```bash
cd /c/OSPanel/domains/Messager/mobile/android/app/build/outputs/apk/release

# Загрузить на сервер
scp app-release.apk root@89.169.39.244:/var/www/messenger/downloads/messenger-v1.0.0.apk
```

**Введите пароль root**

### Установить права (на сервере):

```bash
ssh root@89.169.39.244 "chmod 644 /var/www/messenger/downloads/messenger-v1.0.0.apk"
```

---

## ✅ ШАГ 4: ПРОВЕРКА (5 минут)

### Проверьте все ссылки:

**Frontend:**
```
http://89.169.39.244
```

**Backend API:**
```
http://89.169.39.244:3001
```

**Страница скачивания APK:**
```
http://89.169.39.244/download.html
```

**Прямая ссылка на APK:**
```
http://89.169.39.244/messenger-v1.0.0.apk
```

### Тест регистрации:

1. Откройте http://89.169.39.244
2. Регистрация
3. Username: `test1`
4. Email: `test1@test.com`
5. Password: `Test123456`
6. Зарегистрироваться

**Если работает → ВСЁ ГОТОВО!** 🎉

---

## 🎯 ИТОГО

**Выполните 4 шага:**
1. ✅ Деплой (15 мин)
2. ✅ Сборка APK (30 мин)
3. ✅ Загрузка APK (5 мин)
4. ✅ Проверка (5 мин)

**Общее время:** ~1 час

**Результат:**
- ✅ Сайт работает: http://89.169.39.244
- ✅ APK доступен: http://89.169.39.244/download.html
- ✅ Можно делиться ссылкой!

---

## 🆘 ПРОБЛЕМЫ?

### Деплой не работает:

```bash
ssh root@89.169.39.244
pm2 logs messenger-api
pm2 restart messenger-api
```

### APK не собирается:

```powershell
cd mobile\android
.\gradlew clean
.\gradlew assembleRelease --stacktrace
```

### Сайт не открывается:

```bash
ssh root@89.169.39.244
nginx -t
systemctl restart nginx
```

---

**НАЧИНАЙТЕ С ШАГА 1! УДАЧИ! 🚀**
