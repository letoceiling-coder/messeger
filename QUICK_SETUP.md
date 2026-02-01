# ⚡ БЫСТРАЯ НАСТРОЙКА - 3 МИНУТЫ

**После установки Java и Android Studio**

---

## 🎯 ЦЕЛЬ:

Настроить переменные окружения чтобы можно было собрать APK

---

## 🔧 СПОСОБ 1: GUI (РЕКОМЕНДУЕТСЯ)

### 1. Открыть настройки системы:

- Нажмите **Win + R**
- Введите: `sysdm.cpl`
- Enter

### 2. Открыть переменные среды:

- Вкладка **"Дополнительно"**
- Кнопка **"Переменные среды"**

### 3. Добавить JAVA_HOME:

- **"Создать"**
- Имя: `JAVA_HOME`
- Значение: `C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot`
- **ОК**

### 4. Добавить ANDROID_HOME:

- **"Создать"**  
- Имя: `ANDROID_HOME`
- Значение: `C:\Users\dsc-2\AppData\Local\Android\Sdk`
- **ОК**

### 5. Обновить PATH:

- Выберите **`Path`**
- **"Изменить"**
- Добавьте (по одной строке):

```
C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot\bin
C:\Users\dsc-2\AppData\Local\Android\Sdk\platform-tools
```

- **ОК** → **ОК** → **ОК**

### 6. Перезапустить PowerShell

**ВАЖНО:** Закройте все окна PowerShell и откройте новое!

---

## 🔧 СПОСОБ 2: PowerShell Администратор

Откройте PowerShell **от имени Администратора**:

```powershell
# Найти Java
$javaPath = Get-ChildItem "C:\Program Files" -Recurse -Filter "java.exe" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty DirectoryName
$javaHome = Split-Path $javaPath

# Найти Android SDK (откройте Android Studio и посмотрите путь в SDK Manager!)
$androidHome = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"

# Установить переменные
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', $javaHome, 'User')
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $androidHome, 'User')

# Добавить в PATH
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$newPaths = "$javaHome\bin;$androidHome\platform-tools"
[System.Environment]::SetEnvironmentVariable('Path', "$currentPath;$newPaths", 'User')

Write-Host "✅ Готово! Перезапустите PowerShell!"
```

---

## ✅ ПРОВЕРКА:

В **новом** PowerShell:

```powershell
java -version
echo $env:ANDROID_HOME
```

---

## 🚀 ДАЛЬШЕ:

После проверки:

```powershell
cd c:\OSPanel\domains\Messager\mobile
npm install
```

---

**Настройте окружение!** ⚡
