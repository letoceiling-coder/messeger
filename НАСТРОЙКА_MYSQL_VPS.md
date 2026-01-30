# 🗄️ НАСТРОЙКА MYSQL НА VPS

## 📋 ШАГ 1: СОЗДАТЬ БАЗУ ДАННЫХ И ПОЛЬЗОВАТЕЛЯ

Выполните в SSH сессии:

```bash
# Войти в MySQL
mysql -u root

# В MySQL выполните:
CREATE DATABASE messager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'messager_user'@'localhost' IDENTIFIED BY 'r7nCbBSN%cr3';
GRANT ALL PRIVILEGES ON messager.* TO 'messager_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 📋 ШАГ 2: ПРОВЕРКА ПОДКЛЮЧЕНИЯ

```bash
mysql -u messager_user -p messager
# Введите пароль: r7nCbBSN%cr3
# Должно подключиться успешно
EXIT;
```

---

## ✅ ГОТОВО!

После настройки MySQL сообщите мне, и я помогу:
1. Перенести проект на VPS
2. Настроить Nginx
3. Запустить Backend
