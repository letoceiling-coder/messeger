# ОБНОВЛЕНИЕ ПРОЕКТА ДЛЯ MYSQL

## ✅ ИЗМЕНЕНИЯ

1. **Prisma schema** обновлен для MySQL
2. **DATABASE_URL** настроен для вашей БД
3. **Telegram Bot Token** добавлен
4. **Redis** - опционально (можно включить через панель)

---

## 🔄 ЧТО НУЖНО СДЕЛАТЬ

### На сервере:

```bash
ssh dsc23ytp@5.101.156.207
cd ~/messager/backend

# Обновить Prisma schema (если еще не обновлен)
# Проверить, что provider = "mysql"
cat prisma/schema.prisma | grep provider

# Если еще postgresql, обновить:
sed -i 's/provider = "postgresql"/provider = "mysql"/' prisma/schema.prisma

# Создать .env.production
cat > .env.production << 'EOF'
DATABASE_URL=mysql://dsc23ytp_mess:r7nCbBSN%cr3@localhost:3306/dsc23ytp_mess
JWT_SECRET=your-secret-key-change-this-in-production-min-32-chars
REDIS_URL=redis://localhost:6379
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://parser-auto.siteaccess.ru
TELEGRAM_BOT_TOKEN=8519359237:AAG5sbsq8O0OJS0dGVJDp_2wNGd1gED5eDY
EOF

# Сгенерировать JWT_SECRET
JWT_SECRET=$(openssl rand -base64 32)
sed -i "s/your-secret-key-change-this-in-production-min-32-chars/$JWT_SECRET/" .env.production

# Установить зависимости
npm install --production

# Генерация Prisma Client
npx prisma generate

# Миграция БД
npx prisma migrate deploy

# Сборка
npm run build

# Создать директории
mkdir -p uploads/audio logs

# Установить PM2
npm install -g pm2

# Запустить
pm2 start ecosystem.config.js
pm2 save
```

---

## 📋 ДАННЫЕ ПОДКЛЮЧЕНИЯ

- **База данных:** MySQL
- **Имя БД:** `dsc23ytp_mess`
- **Пароль:** `r7nCbBSN%cr3`
- **URL:** `mysql://dsc23ytp_mess:r7nCbBSN%cr3@localhost:3306/dsc23ytp_mess`

---

## ✅ ГОТОВО!

Проект обновлен для работы с MySQL!
