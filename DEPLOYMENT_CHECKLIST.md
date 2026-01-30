# ЧЕКЛИСТ ДЛЯ DEPLOYMENT

## ПЕРЕД DEPLOYMENT

### 1. База данных ✅

- [ ] Миграция выполнена: `npx prisma migrate deploy`
- [ ] Схема БД актуальна
- [ ] Индексы созданы
- [ ] Резервное копирование настроено

### 2. Backend ✅

- [ ] Все зависимости установлены
- [ ] Переменные окружения настроены:
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET`
  - [ ] `REDIS_URL`
  - [ ] `TELEGRAM_BOT_TOKEN`
- [ ] Redis запущен и доступен
- [ ] CORS настроен для production доменов
- [ ] Логирование настроено
- [ ] Обработка ошибок настроена

### 3. Frontend Web ✅

- [ ] Переменные окружения настроены:
  - [ ] `VITE_API_URL`
  - [ ] `VITE_WS_URL`
- [ ] Production build создан: `npm run build`
- [ ] Статические файлы оптимизированы
- [ ] HTTPS настроен

### 4. Mobile ✅

- [ ] Production build создан
- [ ] API URL настроен для production
- [ ] WebSocket URL настроен для production

### 5. Telegram MiniApp ✅

- [ ] Bot создан через @BotFather
- [ ] MiniApp URL настроен (HTTPS)
- [ ] Bot Token добавлен в Backend .env
- [ ] Тестирование в Telegram пройдено

---

## БЕЗОПАСНОСТЬ

### Backend

- [ ] JWT_SECRET сложный и секретный
- [ ] Redis защищен паролем (production)
- [ ] CORS ограничен нужными доменами
- [ ] Rate limiting настроен
- [ ] Валидация входных данных работает
- [ ] SQL injection защита (Prisma)
- [ ] XSS защита

### Frontend

- [ ] HTTPS обязателен
- [ ] Токены хранятся безопасно
- [ ] Приватные ключи E2EE защищены
- [ ] CORS настроен правильно

---

## ПРОИЗВОДИТЕЛЬНОСТЬ

### Backend

- [ ] Redis настроен для кэширования
- [ ] Database connection pooling настроен
- [ ] WebSocket оптимизирован
- [ ] Статические файлы на CDN

### Frontend

- [ ] Code splitting настроен
- [ ] Lazy loading компонентов
- [ ] Оптимизация изображений
- [ ] Минификация и сжатие

---

## МОНИТОРИНГ

- [ ] Логирование настроено
- [ ] Error tracking (Sentry и т.д.)
- [ ] Метрики производительности
- [ ] Мониторинг Redis
- [ ] Мониторинг БД
- [ ] Алерты настроены

---

## ДОКУМЕНТАЦИЯ

- [ ] API документация обновлена
- [ ] README обновлен
- [ ] Инструкции по развертыванию
- [ ] Troubleshooting guide
- [ ] Changelog обновлен

---

## ТЕСТИРОВАНИЕ

- [ ] Unit тесты пройдены
- [ ] Integration тесты пройдены
- [ ] E2E тесты пройдены
- [ ] Load testing выполнен
- [ ] Security testing выполнен

---

## BACKUP И ВОССТАНОВЛЕНИЕ

- [ ] Backup БД настроен
- [ ] Backup Redis настроен (если нужен)
- [ ] Процедура восстановления документирована
- [ ] Тестирование восстановления выполнено

---

## ПРОЦЕСС DEPLOYMENT

### 1. Подготовка

```bash
# Backend
cd backend
npm install --production
npx prisma generate
npx prisma migrate deploy

# Frontend
cd frontend-web
npm install
npm run build
```

### 2. Развертывание

```bash
# Backend
pm2 start ecosystem.config.js
# или
docker-compose up -d

# Frontend
# Загрузить build на сервер/CDN
```

### 3. Проверка

- [ ] Backend отвечает на health check
- [ ] Frontend загружается
- [ ] WebSocket подключается
- [ ] E2EE работает
- [ ] Telegram MiniApp работает

---

## POST-DEPLOYMENT

- [ ] Мониторинг работает
- [ ] Логи проверяются
- [ ] Пользователи могут регистрироваться
- [ ] Сообщения отправляются
- [ ] E2EE работает
- [ ] Telegram MiniApp работает

---

## ROLLBACK ПЛАН

- [ ] Процедура rollback документирована
- [ ] Backup доступен
- [ ] Время восстановления оценено

---

## КОНТАКТЫ

- [ ] Контакты для экстренных ситуаций
- [ ] Документация доступна команде
- [ ] Процедуры документированы
