# Dockerfile для Backend (NestJS)

FROM node:18-alpine AS builder

WORKDIR /app

# Копирование package файлов
COPY package*.json ./
COPY prisma ./prisma/

# Установка зависимостей
RUN npm ci

# Копирование исходного кода
COPY . .

# Генерация Prisma Client
RUN npx prisma generate

# Сборка проекта
RUN npm run build

# Production образ
FROM node:18-alpine

WORKDIR /app

# Установка только production зависимостей
COPY package*.json ./
RUN npm ci --only=production

# Копирование собранного приложения
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Создание директории для uploads
RUN mkdir -p uploads/audio

# Пользователь для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs

# Порт
EXPOSE 3000

# Запуск приложения
CMD ["node", "dist/main.js"]
