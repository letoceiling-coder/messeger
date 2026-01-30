# 🖥️ ПОДКЛЮЧЕНИЕ К НОВОМУ VPS

## ⚠️ ВАЖНО

Вы подключились к старому серверу `dsc23ytp@dragon`, а не к новому VPS!

**Новый VPS:**
- IP: `89.169.39.244`
- Пользователь: `root`
- Подключение: `root@89.169.39.244`

---

## 🔧 ПОДКЛЮЧЕНИЕ К НОВОМУ VPS

### Вариант 1: Через веб-терминал (РЕКОМЕНДУЕТСЯ)

1. В панели управления VPS найдите раздел **"Терминал"**
2. Нажмите на него
3. Откроется веб-терминал для нового VPS
4. Выполните команды там

### Вариант 2: Через SSH (после входа по паролю)

```bash
# Войдите по паролю (из email или заданный)
ssh root@89.169.39.244

# После входа выполните:
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCfDT2nhPFvSoDEj6nOCr/kQKxnvCjUTzIh66JqTSoySMqVgJH44M0zEgtj/zM3f5rBBVtLq9vYNUbFnWA7sxrXasmzbYGSCZ1jG8Hm5BABN/Be6HSqganNlPHsVlQlVrpi7H2z8Tw7U5NYV/a4vF9FwToKGBTrhZFFmpGhp773pRDhwP2agzDXGoMrhHAjoTeGBcR1ao7gt5zUtiHxMBKwtV2RcLq0jOR8brWVQGAUweuhPOSzrAf1pvDYiIvvVZyF2Wv4QIKE4YpuGjhzTJlNaXMBeCtyPgNa/rxF2kZRmH5lLAlUmMt71I/n5dLbs60xJLSdWF7ec2I695e4sQi2ONkdJ1nhjNKZfK8tVJ4CoQIkThd8uJiqO+GLcjJscUt8v0JjzNxoMUPCOaOycsV0crEuq4mCXHbKrkGrPGFquaAM4/1b9goV7vOT6GdO2jUcIGUz6fGFIum3zMQ80IvdJUfQ1xc5UB4soIKkSTmhpTr3l2glhpt7+Nq3oGiKHrd/OKedy0SZf+YrcyW6zuMhm0duFA6mMVppjfae0CmWb+9i9U/ZVe1ytImXngtZT1PeOCmsUHihUTMOTNWE2cPKoWz+ssLeQWoGhCQYeHy6d8RmTLhbLhWfMzUvrGsaUorLgILjrp6+eIIovrUe3QcrKevhqH4q/Atec2AXCNpwvw== dsc-2@localhost" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

---

## ✅ ПОСЛЕ ПОДКЛЮЧЕНИЯ К VPS

После того, как подключитесь к новому VPS (`root@89.169.39.244`), я помогу:

1. **Установить необходимое ПО:**
   - Node.js
   - MySQL
   - Nginx
   - PM2

2. **Перенести проект на VPS**

3. **Настроить Nginx для проксирования**

4. **Запустить Backend**

---

## 🎯 РЕКОМЕНДАЦИЯ

**Используйте веб-терминал в панели Beget:**
- Зайдите в панель управления VPS
- Найдите раздел "Терминал"
- Нажмите на него
- Выполните команды там

Это самый быстрый способ!

---

## ✅ ГОТОВО!

**Следующие шаги:**
1. Подключитесь к новому VPS (`root@89.169.39.244`)
2. Выполните команды для добавления SSH-ключа
3. Сообщите мне - помогу установить ПО!
