# 🔐 НАСТРОЙКА SSH-КЛЮЧА НА VPS

## ✅ ЦЕЛЬ

Настроить авторизацию по SSH-ключу, чтобы работать без пароля.

---

## 📋 ИНСТРУКЦИЯ

### Выполните на VPS (где вы уже подключены):

```bash
# Создать директорию .ssh
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Добавить ваш SSH-ключ
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCfDT2nhPFvSoDEj6nOCr/kQKxnvCjUTzIh66JqTSoySMqVgJH44M0zEgtj/zM3f5rBBVtLq9vYNUbFnWA7sxrXasmzbYGSCZ1jG8Hm5BABN/Be6HSqganNlPHsVlQlVrpi7H2z8Tw7U5NYV/a4vF9FwToKGBTrhZFFmpGhp773pRDhwP2agzDXGoMrhHAjoTeGBcR1ao7gt5zUtiHxMBKwtV2RcLq0jOR8brWVQGAUweuhPOSzrAf1pvDYiIvvVZyF2Wv4QIKE4YpuGjhzTJlNaXMBeCtyPgNa/rxF2kZRmH5lLAlUmMt71I/n5dLbs60xJLSdWF7ec2I695e4sQi2ONkdJ1nhjNKZfK8tVJ4CoQIkThd8uJiqO+GLcjJscUt8v0JjzNxoMUPCOaOycsV0crEuq4mCXHbKrkGrPGFquaAM4/1b9goV7vOT6GdO2jUcIGUz6fGFIum3zMQ80IvdJUfQ1xc5UB4soIKkSTmhpTr3l2glhpt7+Nq3oGiKHrd/OKedy0SZf+YrcyW6zuMhm0duFA6mMVppjfae0CmWb+9i9U/ZVe1ytImXngtZT1PeOCmsUHihUTMOTNWE2cPKoWz+ssLeQWoGhCQYeHy6d8RmTLhbLhWfMzUvrGsaUorLgILjrp6+eIIovrUe3QcrKevhqH4q/Atec2AXCNpwvw== dsc-2@localhost" >> ~/.ssh/authorized_keys

# Установить правильные права
chmod 600 ~/.ssh/authorized_keys
```

---

## ✅ ПРОВЕРКА

После выполнения команд попробуйте подключиться с вашего компьютера:

```bash
ssh root@89.169.39.244
```

Должно подключиться **без запроса пароля**!

---

## 🚀 ГОТОВО!

После настройки SSH-ключа можно будет работать без пароля.

Затем продолжим настройку MySQL и проекта.
