# ✅ ИСПРАВЛЕНИЕ EMAIL - CASE-INSENSITIVE

## 🔍 ПРОБЛЕМА:

1. **Регистрация:** `dsc-23@yandex.ru` → "Пользователь с таким email уже существует"
2. **Вход:** `dsc-23@yandex.RU` → 401 Unauthorized

**Причина:** Email в базе сохранен как `dsc-23@yandex.RU` (uppercase), а проверки не учитывают регистр.

---

## ✅ РЕШЕНИЕ:

### 1. Исправлена регистрация

- Email нормализуется в lowercase перед проверкой и сохранением
- Проверка существования email теперь case-insensitive

**Код:**
```typescript
async register(dto: RegisterDto): Promise<AuthResponseDto> {
  // Нормализация email (case-insensitive)
  const emailNormalized = dto.email.toLowerCase().trim();
  
  // Проверка существования email (case-insensitive)
  const existingUserByEmail = await this.prisma.user.findFirst({
    where: {
      OR: [
        { email: emailNormalized },
        { email: { equals: dto.email.trim(), mode: 'insensitive' } },
      ],
    },
  });

  // Создание пользователя (email сохраняем в нормализованном виде)
  const user = await this.prisma.user.create({
    data: {
      email: emailNormalized, // Сохраняем в lowercase
      username: dto.username,
      passwordHash,
    },
  });
}
```

### 2. Исправлен вход

- Email нормализуется перед поиском
- Поиск работает с любым регистром

**Код:**
```typescript
async login(dto: LoginDto): Promise<AuthResponseDto> {
  // Нормализация email (case-insensitive)
  const emailNormalized = dto.email.toLowerCase().trim();
  
  // Поиск пользователя по нормализованному email
  const foundUser = await this.prisma.user.findFirst({
    where: {
      OR: [
        { email: emailNormalized },
        { email: dto.email.trim() },
      ],
    },
  });
}
```

### 3. Нормализация существующих данных

Выполнена миграция для нормализации всех email в базе данных в lowercase:
```sql
UPDATE users SET email = LOWER(email) WHERE email != LOWER(email);
```

---

## 🎉 ГОТОВО!

Теперь:
- ✅ Регистрация работает с любым регистром email
- ✅ Вход работает с любым регистром email
- ✅ Все email в базе нормализованы в lowercase
- ✅ Новые пользователи сохраняются с email в lowercase

---

## 📝 ПРИМЕЧАНИЕ:

Если проблема сохраняется, попробуйте:
1. Удалить существующего пользователя и зарегистрироваться заново
2. Или использовать точно такой же email, как в базе (после нормализации это `dsc-23@yandex.ru`)
