# 🚀 БЫСТРОЕ РАЗВЕРТЫВАНИЕ С MYSQL

## ✅ ДАННЫЕ ПОДКЛЮЧЕНИЯ

- **База данных:** MySQL
- **Имя БД:** `dsc23ytp_mess`
- **Пароль:** `r7nCbBSN%cr3`
- **Redis:** Можно включить через панель Beget (2₽/день)
- **Telegram Bot Token:** `8519359237:AAG5sbsq8O0OJS0dGVJDp_2wNGd1gED5eDY`

---

## 📋 ПОШАГОВАЯ ИНСТРУКЦИЯ

### ШАГ 1: Подключитесь к серверу

```bash
ssh dsc23ytp@5.101.156.207
```

---

### ШАГ 2: Настройка Backend

```bash
cd ~/messager/backend

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

# ВАЖНО: Отредактируйте JWT_SECRET!
# Сгенерируйте случайную строку минимум 32 символа
nano .env.production

# Установить зависимости
npm install --production

# Генерация Prisma Client (для MySQL)
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
pm2 startup
```

---

### ШАГ 3: Настройка Frontend

```bash
cd ~/messager/frontend-web

# Создать .env.production
cat > .env.production << 'EOF'
VITE_API_URL=https://parser-auto.siteaccess.ru/api
VITE_WS_URL=wss://parser-auto.siteaccess.ru
EOF

# Установить зависимости
npm install

# Сборка
npm run build

# Разместить build в public_html
cp -r dist/* ~/parser-auto.site-access.ru/public_html/
```

---

### ШАГ 4: Настройка Redis (опционально)

**Если нужен Redis:**

1. Зайдите в панель Beget: `https://cp.beget.com/sites`
2. Откройте раздел "Сайты"
3. В разделе "Дополнительно" включите "Хранить сессии сайтов в Redis"
4. Подтвердите запуск Redis (стоимость: 2₽/день)

**Если Redis не нужен:**

Можно временно убрать Redis из конфигурации или оставить как есть (приложение будет работать без Redis).

---

### ШАГ 5: Проверка

```bash
# Проверить Backend
curl http://localhost:3000/health

# Проверить PM2
pm2 status
pm2 logs messager-backend

# Проверить Frontend
# Откройте: https://parser-auto.siteaccess.ru/
```

---

## ⚠️ ВАЖНЫЕ ЗАМЕЧАНИЯ

1. **JWT_SECRET:**
   - Должен быть минимум 32 символа
   - Используйте случайную строку
   - Не храните в Git!

   Пример генерации:
   ```bash
   openssl rand -base64 32
   ```

2. **MySQL:**
   - База данных уже создана: `dsc23ytp_mess`
   - Пароль: `r7nCbBSN%cr3`
   - URL уже настроен в `.env.production`

3. **Redis:**
   - Можно включить через панель Beget (2₽/день)
   - Или временно убрать из конфигурации

4. **Telegram Bot:**
   - Токен уже добавлен в конфигурацию
   - Бот должен быть создан через @BotFather

---

## 🐛 РЕШЕНИЕ ПРОБЛЕМ

### База данных не подключается:
```bash
# Проверьте DATABASE_URL в .env.production
# Убедитесь, что база данных существует
mysql -u dsc23ytp_mess -p -e "SHOW DATABASES;"
```

### PM2 не запускается:
```bash
pm2 logs messager-backend
# Проверьте логи на ошибки
```

### Prisma миграция не работает:
```bash
# Убедитесь, что Prisma schema обновлен для MySQL
# Проверьте, что база данных доступна
npx prisma migrate status
```

---

## ✅ ГОТОВО!

После выполнения всех шагов проект должен быть доступен:
- Frontend: `https://parser-auto.siteaccess.ru/`
- Backend API: `https://parser-auto.siteaccess.ru/api`
