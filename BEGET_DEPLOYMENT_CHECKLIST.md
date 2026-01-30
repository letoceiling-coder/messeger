# ЧЕКЛИСТ РАЗВЕРТЫВАНИЯ НА BEGET

## ПЕРЕД РАЗВЕРТЫВАНИЕМ

### Локальная подготовка

- [ ] Проект собран и протестирован локально
- [ ] Все зависимости установлены
- [ ] .env.production.example создан
- [ ] Документация обновлена

---

## ЭТАП 1: ПОДКЛЮЧЕНИЕ К СЕРВЕРУ

- [ ] SSH доступ настроен
- [ ] Подключение к серверу проверено
- [ ] Node.js установлен (версия 18+)
- [ ] npm установлен

**Команды:**
```bash
ssh user@server.beget.com
node --version
npm --version
```

---

## ЭТАП 2: БАЗА ДАННЫХ

- [ ] PostgreSQL создана через панель Beget
- [ ] Данные подключения записаны
- [ ] DATABASE_URL обновлен в .env.production
- [ ] Миграции выполнены: `npx prisma migrate deploy`
- [ ] Prisma Client сгенерирован: `npx prisma generate`
- [ ] Подключение к БД проверено

**Команды:**
```bash
cd ~/messager/backend
npx prisma migrate deploy
npx prisma generate
psql -h localhost -U user -d database
```

---

## ЭТАП 3: REDIS

- [ ] Redis установлен или доступен на Beget
- [ ] REDIS_URL обновлен в .env.production
- [ ] Redis запущен и проверен: `redis-cli ping`
- [ ] Подключение из Backend проверено

**Команды:**
```bash
redis-cli ping
# Должен вернуть: PONG
```

---

## ЭТАП 4: BACKEND

- [ ] Проект загружен на сервер
- [ ] Зависимости установлены: `npm install --production`
- [ ] .env.production создан и заполнен
- [ ] Проект собран: `npm run build`
- [ ] Директории созданы: `uploads/audio`, `logs`
- [ ] PM2 установлен: `npm install -g pm2`
- [ ] Backend запущен через PM2
- [ ] PM2 сохранен: `pm2 save`
- [ ] PM2 автозапуск настроен: `pm2 startup`
- [ ] Backend отвечает: `curl http://localhost:3000/health`

**Команды:**
```bash
cd ~/messager/backend
npm install --production
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## ЭТАП 5: FRONTEND

- [ ] Проект загружен на сервер
- [ ] Зависимости установлены: `npm install`
- [ ] .env.production создан и заполнен
- [ ] Проект собран: `npm run build`
- [ ] Файлы скопированы в public_html
- [ ] Права доступа настроены

**Команды:**
```bash
cd ~/messager/frontend-web
npm install
npm run build
cp -r dist/* ~/public_html/
```

---

## ЭТАП 6: NGINX

- [ ] Конфигурации созданы
- [ ] Символические ссылки созданы
- [ ] Конфигурация проверена: `nginx -t`
- [ ] Nginx перезагружен: `systemctl reload nginx`
- [ ] Frontend доступен по HTTPS
- [ ] API доступен по HTTPS
- [ ] WebSocket работает через WSS

**Команды:**
```bash
sudo ln -s /etc/nginx/sites-available/messager-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/messager-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ЭТАП 7: SSL

- [ ] SSL сертификаты установлены
- [ ] Let's Encrypt настроен (через Certbot или панель)
- [ ] HTTPS работает для Frontend
- [ ] HTTPS работает для API
- [ ] WSS работает для WebSocket
- [ ] Автообновление сертификатов настроено

**Команды:**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

---

## ЭТАП 8: TELEGRAM BOT

- [ ] Bot создан через @BotFather
- [ ] Bot Token получен
- [ ] TELEGRAM_BOT_TOKEN добавлен в .env.production
- [ ] MiniApp URL настроен в BotFather
- [ ] MiniApp доступен по HTTPS
- [ ] Тестирование в Telegram пройдено

---

## ЭТАП 9: ТЕСТИРОВАНИЕ

### Backend

- [ ] Health check работает
- [ ] API endpoints отвечают
- [ ] WebSocket подключается
- [ ] Аутентификация работает
- [ ] E2EE работает
- [ ] Голосовые сообщения работают
- [ ] Видеозвонки работают

### Frontend

- [ ] Страница загружается
- [ ] Регистрация работает
- [ ] Логин работает
- [ ] Чаты загружаются
- [ ] Сообщения отправляются
- [ ] E2EE работает
- [ ] WebSocket работает

### Mobile

- [ ] Приложение подключается к API
- [ ] Все функции работают
- [ ] E2EE работает

### Telegram MiniApp

- [ ] MiniApp открывается в Telegram
- [ ] Аутентификация работает
- [ ] Все функции доступны

---

## ЭТАП 10: МОНИТОРИНГ И BACKUP

- [ ] PM2 monitoring настроен
- [ ] Логирование настроено
- [ ] Backup скрипт создан
- [ ] Crontab для backup настроен
- [ ] Мониторинг ресурсов настроен

**Команды:**
```bash
pm2 monit
chmod +x ~/messager/backend/scripts/backup.sh
crontab -e
# Добавить: 0 2 * * * ~/messager/backend/scripts/backup.sh
```

---

## ЭТАП 11: БЕЗОПАСНОСТЬ

- [ ] Firewall настроен
- [ ] Сильные пароли установлены
- [ ] .env файлы защищены (права 600)
- [ ] SSH ключи настроены
- [ ] Неиспользуемые порты закрыты
- [ ] Регулярные обновления настроены

**Команды:**
```bash
chmod 600 ~/messager/backend/.env.production
sudo ufw status
```

---

## ЭТАП 12: ОПТИМИЗАЦИЯ

- [ ] PM2 cluster mode настроен
- [ ] Nginx кэширование настроено
- [ ] Gzip сжатие включено
- [ ] Статические файлы оптимизированы
- [ ] Database индексы созданы

---

## ФИНАЛЬНАЯ ПРОВЕРКА

- [ ] Все сервисы запущены
- [ ] Все тесты пройдены
- [ ] Мониторинг работает
- [ ] Backup работает
- [ ] Документация обновлена
- [ ] Команда проинформирована

---

## ГОТОВО К PRODUCTION! ✅

После выполнения всех пунктов проект готов к использованию в production.

---

## КОНТАКТЫ ДЛЯ ПОДДЕРЖКИ

При возникновении проблем:
1. Проверить логи: `pm2 logs`, `sudo journalctl -u nginx`
2. Проверить ресурсы: `htop`, `df -h`
3. Проверить подключения: `netstat -tulpn`
4. Обратиться к документации: `DEPLOYMENT_BEGET.md`
