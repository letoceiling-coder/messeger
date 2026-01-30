# ИНСТРУКЦИИ ПО МИГРАЦИИ БД

## ВЫПОЛНЕНИЕ МИГРАЦИИ

### Предварительные требования

1. PostgreSQL установлен и запущен
2. База данных создана
3. `DATABASE_URL` настроен в `.env`

### Шаги

1. **Перейти в директорию backend:**
   ```bash
   cd backend
   ```

2. **Проверить схему:**
   ```bash
   npx prisma format
   ```

3. **Выполнить миграцию:**
   ```bash
   npx prisma migrate dev --name add_e2ee_and_telegram
   ```

4. **Сгенерировать Prisma Client:**
   ```bash
   npx prisma generate
   ```

### Что будет создано

**Новая таблица:**
- `user_keys` - для хранения публичных ключей пользователей

**Новые поля в таблице `users`:**
- `telegram_id` - уникальный идентификатор Telegram

**Новые поля в таблице `messages`:**
- `is_encrypted` - флаг зашифрованного сообщения
- `encrypted_content` - зашифрованное содержимое
- `encrypted_key` - зашифрованный AES ключ
- `iv` - initialization vector для AES

### Проверка миграции

После выполнения миграции проверьте:

```bash
# Открыть Prisma Studio
npx prisma studio

# Или проверить через SQL
psql -d messager -c "\d user_keys"
psql -d messager -c "\d messages"
```

### Откат миграции (если нужно)

```bash
npx prisma migrate reset
```

**Внимание:** Это удалит все данные!

---

## PRODUCTION МИГРАЦИЯ

Для production используйте:

```bash
npx prisma migrate deploy
```

Это применит все pending миграции без интерактивного режима.

---

## ПРОВЕРКА СХЕМЫ

Убедитесь, что схема содержит:

```prisma
model User {
  // ... существующие поля
  telegramId   String?   @unique @map("telegram_id")
  userKey      UserKey?
}

model Message {
  // ... существующие поля
  isEncrypted Boolean  @default(false) @map("is_encrypted")
  encryptedContent String? @map("encrypted_content")
  encryptedKey     String? @map("encrypted_key")
  iv               String? @map("iv")
}

model UserKey {
  id        String   @id @default(uuid())
  userId   String   @unique @map("user_id")
  publicKey String  @map("public_key")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("user_keys")
}
```

---

## РЕШЕНИЕ ПРОБЛЕМ

### Ошибка подключения к БД
- Проверить `DATABASE_URL` в `.env`
- Убедиться, что PostgreSQL запущен
- Проверить права доступа

### Ошибка миграции
- Проверить, что БД пустая или совместима
- Проверить логи миграции
- При необходимости выполнить `prisma migrate reset`

### Конфликты схемы
- Проверить текущую схему БД
- Сравнить с `schema.prisma`
- При необходимости создать новую миграцию

---

## ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ

- Prisma Migrate: https://www.prisma.io/docs/concepts/components/prisma-migrate
- Prisma Schema: https://www.prisma.io/docs/concepts/components/prisma-schema
