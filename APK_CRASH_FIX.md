# Исправление: приложение закрывается при запуске

## Причина
Отсутствовали файлы **MainActivity.kt** и **MainApplication.kt** — точки входа Android-приложения.

## Что сделано
1. Созданы `MainActivity.kt` и `MainApplication.kt`
2. Добавлен плагин Kotlin
3. Создан `proguard-rules.pro` для корректной сборки release

## Пересборка APK

### В Android Studio
1. Откройте `c:\OSPanel\domains\Messager\mobile\android` в Android Studio
2. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. APK будет в `app\build\outputs\apk\release\app-release.apk`

### Или в терминале
```powershell
cd c:\OSPanel\domains\Messager\mobile\android
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot'
$env:ANDROID_HOME = 'C:\Users\dsc-2\AppData\Local\Android\Sdk'
.\gradlew.bat assembleRelease
```

## Загрузка нового APK на сервер
```powershell
.\scripts\upload-apk.ps1
```

Или вручную:
```powershell
scp "c:\OSPanel\domains\Messager\mobile\android\app\build\outputs\apk\release\app-release.apk" root@89.169.39.244:/var/www/messenger/downloads/messenger-v1.0.0.apk
```

## Если всё ещё падает — получить логи
Подключите телефон по USB, включите отладку по USB и выполните:
```powershell
adb logcat *:E | findstr "ReactNative\|AndroidRuntime\|FATAL"
```
