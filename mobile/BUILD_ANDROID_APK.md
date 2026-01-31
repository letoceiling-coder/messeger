# Инструкция по сборке Android APK для Messager

Этот документ описывает процесс создания APK-файла для установки на Android-устройства.

---

## Предварительные требования

1. **Node.js** и **npm** установлены
2. **Expo CLI** установлен глобально:
   ```bash
   npm install -g expo-cli
   ```
3. **EAS CLI** установлен глобально:
   ```bash
   npm install -g eas-cli
   ```
4. **Аккаунт Expo** (зарегистрироваться на https://expo.dev)

---

## Шаг 1: Вход в Expo аккаунт

```bash
cd mobile
eas login
```

Введите email и пароль от вашего аккаунта Expo.

---

## Шаг 2: Настройка проекта

Файл `eas.json` уже создан с настройками для сборки APK. Проверьте, что в `app.json` указаны правильные данные:

```json
{
  "expo": {
    "name": "Messager",
    "slug": "messager",
    "version": "1.0.0",
    "android": {
      "package": "com.messager.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

---

## Шаг 3: Сборка APK (preview)

Для создания APK-файла для тестирования:

```bash
cd mobile
eas build --platform android --profile preview
```

**Что происходит:**
1. EAS загружает ваш код на облачные серверы Expo
2. Создаётся Android-проект и компилируется APK
3. По завершении вы получите ссылку для скачивания APK

**Время сборки:** обычно 10-15 минут.

---

## Шаг 4: Скачивание APK

После успешной сборки в консоли появится ссылка:

```
✔ Build finished
  Build artifact: https://expo.dev/artifacts/eas/XXXXX.apk
```

Скопируйте эту ссылку или скачайте файл:

```bash
# Скачать напрямую через EAS CLI
eas build:download --platform android --profile preview
```

APK-файл будет сохранён в папке `mobile/`.

---

## Шаг 5: Размещение APK для пользователей

### Вариант 1: Прямая ссылка на Expo

Используйте ссылку из шага 4 напрямую — она будет доступна в течение 30 дней.

### Вариант 2: Размещение на своём сервере

1. Загрузите APK на ваш сервер в папку `public/downloads/`:
   ```bash
   scp messager-preview.apk user@your-server:/path/to/public/downloads/messager-latest.apk
   ```

2. Обновите ссылку в `INSTALL_LINKS.md`:
   ```
   https://your-domain.com/downloads/messager-latest.apk
   ```

---

## Шаг 6: Production сборка (для публикации в Google Play)

Когда приложение готово к публикации:

```bash
eas build --platform android --profile production
```

Это создаст AAB-файл (Android App Bundle) для загрузки в Google Play Console.

---

## Установка APK на устройство

### Способ 1: Прямое скачивание

1. Откройте ссылку на APK на Android-устройстве
2. Скачайте файл
3. Откройте файл и разрешите установку из неизвестных источников
4. Следуйте инструкциям на экране

### Способ 2: Через ADB (для разработчиков)

```bash
adb install messager-preview.apk
```

---

## OTA-обновления (Over-The-Air)

Для обновления JS-кода без пересборки APK используйте EAS Update:

```bash
# Настроить Update (один раз)
eas update:configure

# Отправить обновление
eas update --branch production --message "Исправлены ошибки и улучшен UI"
```

Пользователи получат обновление при следующем запуске приложения.

---

## Важные замечания

- **Первая сборка:** EAS может запросить создание Android Keystore — согласитесь, EAS сохранит ключи на своих серверах.
- **Версия:** При каждой новой сборке увеличивайте `versionCode` и `version` в `app.json`.
- **Размер APK:** Для уменьшения размера используйте AAB вместо APK в production.

---

## Полезные команды

```bash
# Список всех сборок
eas build:list --platform android

# Посмотреть статус текущей сборки
eas build:view

# Скачать последнюю сборку
eas build:download --platform android --latest

# Отменить текущую сборку
eas build:cancel
```

---

## Следующие шаги

После создания APK обновите `INSTALL_LINKS.md` с актуальными ссылками для пользователей.
