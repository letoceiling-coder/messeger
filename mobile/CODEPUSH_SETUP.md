# 🔄 CodePush Setup Guide

Over-The-Air (OTA) обновления с помощью Microsoft CodePush.

---

## 🎯 Что такое CodePush?

CodePush позволяет **обновлять JavaScript код приложения** без переустановки:
- ✅ Мгновенные обновления
- ✅ Без прохождения ревью магазинов
- ✅ Обновление только изменённых файлов
- ✅ Rollback при ошибках

**НЕ работает для:**
- ❌ Нативного кода (Java/Kotlin, Swift/Objective-C)
- ❌ Нативных зависимостей (native modules)
- ❌ Изменений манифеста/Info.plist

---

## 📋 Предварительные требования

- ✅ Microsoft/GitHub аккаунт
- ✅ App Center CLI установлен
- ✅ Проект React Native готов

---

## 🚀 Шаг 1: Установка App Center CLI

```bash
npm install -g appcenter-cli
```

### 1.1. Войти в систему

```bash
appcenter login
```

Откроется браузер для аутентификации.

---

## 📱 Шаг 2: Создание приложений в App Center

### 2.1. Создать Android приложение

```bash
appcenter apps create -d MessengerMobile-Android -o Android -p React-Native
```

### 2.2. Создать iOS приложение

```bash
appcenter apps create -d MessengerMobile-iOS -o iOS -p React-Native
```

### 2.3. Проверить созданные приложения

```bash
appcenter apps list
```

Вывод:
```
YOUR_USERNAME/MessengerMobile-Android
YOUR_USERNAME/MessengerMobile-iOS
```

---

## 🔑 Шаг 3: Создание Deployment Keys

### 3.1. Android

#### Production:
```bash
appcenter codepush deployment add -a YOUR_USERNAME/MessengerMobile-Android Production
```

#### Staging:
```bash
appcenter codepush deployment add -a YOUR_USERNAME/MessengerMobile-Android Staging
```

#### Получить ключи:
```bash
appcenter codepush deployment list -a YOUR_USERNAME/MessengerMobile-Android --displayKeys
```

Сохраните **Production Key** и **Staging Key**.

### 3.2. iOS

#### Production:
```bash
appcenter codepush deployment add -a YOUR_USERNAME/MessengerMobile-iOS Production
```

#### Staging:
```bash
appcenter codepush deployment add -a YOUR_USERNAME/MessengerMobile-iOS Staging
```

#### Получить ключи:
```bash
appcenter codepush deployment list -a YOUR_USERNAME/MessengerMobile-iOS --displayKeys
```

---

## 📦 Шаг 4: Установка CodePush SDK

### 4.1. Установить пакет

```bash
npm install --save react-native-code-push
```

### 4.2. iOS: Установить pods

```bash
cd ios
pod install
cd ..
```

---

## ⚙️ Шаг 5: Конфигурация

### 5.1. Android

#### strings.xml

Создайте или отредактируйте:  
`android/app/src/main/res/values/strings.xml`

```xml
<resources>
    <string name="app_name">Messenger</string>
    <string moduleConfig="true" name="CodePushDeploymentKey">YOUR_ANDROID_PRODUCTION_KEY</string>
</resources>
```

**Замените** `YOUR_ANDROID_PRODUCTION_KEY` на ваш Production Key.

#### MainApplication.java

`android/app/src/main/java/com/messengermobile/MainApplication.java`

```java
import com.microsoft.codepush.react.CodePush;

public class MainApplication extends Application implements ReactApplication {
  
  @Override
  protected String getJSBundleFile() {
    return CodePush.getJSBundleFile();
  }
  
  @Override
  protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
        new MainReactPackage(),
        new CodePush(getResources().getString(R.string.CodePushDeploymentKey), getApplicationContext(), BuildConfig.DEBUG)
    );
  }
}
```

### 5.2. iOS

#### AppDelegate.mm

`ios/MessengerMobile/AppDelegate.mm`

```objc
#import <CodePush/CodePush.h>

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [CodePush bundleURL];
#endif
}
```

#### Info.plist

`ios/MessengerMobile/Info.plist`

```xml
<key>CodePushDeploymentKey</key>
<string>YOUR_IOS_PRODUCTION_KEY</string>
```

**Замените** `YOUR_IOS_PRODUCTION_KEY` на ваш Production Key.

---

## 🎨 Шаг 6: Интеграция в приложение

### 6.1. Обернуть App.tsx

`src/App.tsx`

```typescript
import React from 'react';
import codePush from 'react-native-code-push';
import {SafeAreaProvider} from 'react-native-safe-area-context';
// ... other imports

const App = () => {
  return (
    <SafeAreaProvider>
      {/* Your app content */}
    </SafeAreaProvider>
  );
};

// CodePush options
const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
  installMode: codePush.InstallMode.ON_NEXT_RESUME,
  minimumBackgroundDuration: 60 * 10, // 10 минут
};

export default codePush(codePushOptions)(App);
```

### 6.2. Опции CodePush

#### checkFrequency:
- `ON_APP_START` — при запуске приложения
- `ON_APP_RESUME` — при возвращении в приложение (рекомендуется)
- `MANUAL` — только ручные проверки

#### installMode:
- `IMMEDIATE` — немедленно (перезапуск)
- `ON_NEXT_RESUME` — при следующем возвращении (рекомендуется)
- `ON_NEXT_RESTART` — при следующем запуске

### 6.3. Кастомный UI обновления (опционально)

```typescript
import React, {useEffect, useState} from 'react';
import {View, Text, ActivityIndicator} from 'react-native';
import codePush from 'react-native-code-push';

const App = () => {
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    checkForUpdate();
  }, []);

  const checkForUpdate = async () => {
    try {
      const update = await codePush.checkForUpdate();
      
      if (update) {
        setUpdateStatus('Downloading update...');
        
        await update.download((progress) => {
          setProgress(
            (progress.receivedBytes / progress.totalBytes) * 100
          );
        });
        
        setUpdateStatus('Installing...');
        await codePush.notifyApplicationReady();
        
        setUpdateStatus('Update installed! Restarting...');
        codePush.restartApp();
      }
    } catch (error) {
      console.error('CodePush error:', error);
    }
  };

  if (updateStatus) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" />
        <Text>{updateStatus}</Text>
        {progress > 0 && <Text>{Math.round(progress)}%</Text>}
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      {/* Your app content */}
    </SafeAreaProvider>
  );
};

export default codePush()(App);
```

---

## 🚀 Шаг 7: Публикация обновлений

### 7.1. Release обновление (Production)

#### Android:
```bash
appcenter codepush release-react -a YOUR_USERNAME/MessengerMobile-Android -d Production
```

#### iOS:
```bash
appcenter codepush release-react -a YOUR_USERNAME/MessengerMobile-iOS -d Production
```

### 7.2. Staging обновление (для тестирования)

#### Android:
```bash
appcenter codepush release-react -a YOUR_USERNAME/MessengerMobile-Android -d Staging
```

#### iOS:
```bash
appcenter codepush release-react -a YOUR_USERNAME/MessengerMobile-iOS -d Staging
```

### 7.3. С описанием и обязательным обновлением

```bash
appcenter codepush release-react \
  -a YOUR_USERNAME/MessengerMobile-Android \
  -d Production \
  -m \
  --description "Bug fixes and performance improvements"
```

Флаги:
- `-m` или `--mandatory` — обязательное обновление
- `--description "text"` — описание изменений
- `--target-binary-version "1.0.0"` — для конкретной версии приложения

---

## 📊 Шаг 8: Мониторинг обновлений

### 8.1. Проверить статус deployment

```bash
appcenter codepush deployment list -a YOUR_USERNAME/MessengerMobile-Android
```

### 8.2. История обновлений

```bash
appcenter codepush deployment history Production -a YOUR_USERNAME/MessengerMobile-Android
```

### 8.3. Статистика установок

```bash
appcenter codepush deployment info Production -a YOUR_USERNAME/MessengerMobile-Android
```

Вывод:
```
┌────────────┬───────────────┬──────────────┐
│ Label      │ Install Count │ Rollback %   │
├────────────┼───────────────┼──────────────┤
│ v1         │ 1,234         │ 0%           │
│ v2         │ 567           │ 2%           │
└────────────┴───────────────┴──────────────┘
```

---

## 🔄 Шаг 9: Rollback (откат обновления)

### 9.1. Откатить последнее обновление

```bash
appcenter codepush rollback Production -a YOUR_USERNAME/MessengerMobile-Android
```

### 9.2. Откатить к конкретной версии

```bash
appcenter codepush rollback Production --target-release v1 -a YOUR_USERNAME/MessengerMobile-Android
```

---

## 🧪 Шаг 10: Тестирование

### 10.1. Тестовое обновление

1. Внесите изменения в код (например, измените текст)
2. Опубликуйте в Staging:
   ```bash
   appcenter codepush release-react -a YOUR_USERNAME/MessengerMobile-Android -d Staging
   ```
3. Установите Staging версию приложения
4. Запустите приложение
5. Обновление должно загрузиться автоматически

### 10.2. Проверить текущую версию

Добавьте в Settings:

```typescript
import codePush from 'react-native-code-push';

const [version, setVersion] = useState<string>('');

useEffect(() => {
  codePush.getUpdateMetadata().then((update) => {
    if (update) {
      setVersion(`${update.appVersion} (CodePush: ${update.label})`);
    }
  });
}, []);

// Отображение
<Text>Version: {version}</Text>
```

---

## ⚡ Best Practices

### 1. Используйте Staging для тестирования

```bash
# 1. Релиз в Staging
appcenter codepush release-react -a YOUR_USERNAME/MessengerMobile-Android -d Staging

# 2. Тестирование (24-48 часов)

# 3. Promote в Production
appcenter codepush promote -a YOUR_USERNAME/MessengerMobile-Android -s Staging -d Production
```

### 2. Версионирование

Указывайте целевую версию приложения:

```bash
appcenter codepush release-react \
  -a YOUR_USERNAME/MessengerMobile-Android \
  -d Production \
  --target-binary-version "1.0.0"
```

### 3. Обязательные обновления

Для критических исправлений:

```bash
appcenter codepush release-react \
  -a YOUR_USERNAME/MessengerMobile-Android \
  -d Production \
  -m
```

### 4. Мониторинг

Проверяйте статистику установок и откатов:

```bash
appcenter codepush deployment info Production -a YOUR_USERNAME/MessengerMobile-Android
```

Если rollback > 5% — проверьте обновление.

---

## 🐛 Troubleshooting

### Обновление не загружается

**Проверьте:**

1. Deployment Key правильный (в strings.xml / Info.plist)
2. Приложение подключено к интернету
3. `checkFrequency` настроен правильно
4. Версия приложения совпадает с `target-binary-version`

**Логи:**

```typescript
codePush.sync(
  {installMode: codePush.InstallMode.ON_NEXT_RESUME},
  (status) => {
    console.log('CodePush status:', status);
  },
  ({receivedBytes, totalBytes}) => {
    console.log(`Download: ${receivedBytes}/${totalBytes}`);
  }
);
```

### "Bundle not found"

**Решение:**

Пересоберите приложение:

```bash
# Android
cd android && ./gradlew clean && cd ..
npm run android

# iOS
cd ios && pod install && cd ..
npm run ios
```

### Обновление установлено, но не применено

**Решение:**

Убедитесь, что вызван `codePush.notifyApplicationReady()`:

```typescript
codePush.sync().then(() => {
  codePush.notifyApplicationReady();
});
```

---

## 📊 Limits (бесплатный план)

- **Deployment:** неограниченно
- **Releases:** неограниченно
- **Monthly active devices:** 1,000
- **Storage:** 250 MB

Для больших команд рассмотрите платные планы.

---

## 🔐 Безопасность

### 1. Не коммитить Deployment Keys

Добавьте в `.gitignore`:

```
# CodePush
android/app/src/main/res/values/strings.xml
ios/MessengerMobile/Info.plist
```

### 2. Использовать разные ключи

- **Development:** Staging deployment
- **Production:** Production deployment

### 3. Code signing

Для enterprise приложений настройте code signing:

```bash
appcenter codepush release-react \
  -a YOUR_USERNAME/MessengerMobile-Android \
  -d Production \
  --private-key-path ./private.key
```

---

## 📚 Полезные команды

```bash
# Список приложений
appcenter apps list

# Deployment list
appcenter codepush deployment list -a YOUR_USERNAME/MessengerMobile-Android

# История релизов
appcenter codepush deployment history Production -a YOUR_USERNAME/MessengerMobile-Android

# Clear deployment
appcenter codepush deployment clear Production -a YOUR_USERNAME/MessengerMobile-Android

# Удалить deployment
appcenter codepush deployment remove Production -a YOUR_USERNAME/MessengerMobile-Android

# Logout
appcenter logout
```

---

## ✅ Checklist

### Настройка:
- [ ] App Center CLI установлен
- [ ] Вошли в систему (`appcenter login`)
- [ ] Android приложение создано
- [ ] iOS приложение создано
- [ ] Deployment keys получены (Production, Staging)
- [ ] react-native-code-push установлен
- [ ] Android настроен (strings.xml, MainApplication.java)
- [ ] iOS настроен (AppDelegate.mm, Info.plist)
- [ ] App.tsx обёрнут в codePush()

### Тестирование:
- [ ] Staging обновление опубликовано
- [ ] Обновление загружено на устройстве
- [ ] Обновление применено после restart
- [ ] Rollback протестирован

### Production:
- [ ] Production обновление опубликовано
- [ ] Мониторинг настроен
- [ ] Статистика проверяется регулярно
- [ ] Rollback plan готов

---

## 🎯 Следующие шаги

После настройки CodePush:

1. ✅ **CI/CD интеграция** (GitHub Actions, Bitrise)
2. ✅ **Автоматические обновления** при push в main
3. ✅ **A/B тестирование** (разные версии для групп пользователей)
4. ✅ **Crashlytics** (отслеживание ошибок после обновлений)

---

**Версия:** 1.0  
**Дата:** 31 января 2026  
**Статус:** Готово к использованию ✅

**Успешных обновлений! 🔄🚀**
