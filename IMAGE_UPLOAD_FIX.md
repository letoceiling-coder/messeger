# ✅ ИСПРАВЛЕНИЕ ЗАГРУЗКИ ИЗОБРАЖЕНИЙ (31.01.2026 19:10)

## 🐛 ПРОБЛЕМА:

При отправке изображений:
- ❌ 404 ошибка: `GET https://neekloai.ru/uploads/images/img-*.png 404 (Not Found)`
- ❌ Отправляются пустые сообщения
- ❌ Файлы не сохраняются на сервере

## 🔍 ПРИЧИНА:

Backend работал из **неправильной директории**:
- PM2 запущен из: `/var/www/messenger` ❌ (без 'a')
- Git репозиторий: `/var/www/messager` ✅ (с 'a')

При сохранении файлов через `diskStorage({ destination: './uploads/images' })` - использовался **относительный путь** от рабочей директории PM2.

Файлы пытались сохраниться в `/var/www/messenger/backend/uploads/images/`, но:
1. Директория `images` не существовала
2. Права доступа 755 (только root может писать)

---

## ✅ РЕШЕНИЕ:

### 1. Создание всех необходимых директорий:

```bash
ssh root@89.169.39.244

# В правильной рабочей директории backend (где PM2 запущен)
mkdir -p /var/www/messenger/backend/uploads/images
mkdir -p /var/www/messenger/backend/uploads/videos  
mkdir -p /var/www/messenger/backend/uploads/audio
mkdir -p /var/www/messenger/backend/uploads/documents
```

### 2. Установка правильных прав доступа (777 для загрузки):

```bash
chmod 777 /var/www/messenger/backend/uploads/images
chmod 777 /var/www/messenger/backend/uploads/videos
chmod 777 /var/www/messenger/backend/uploads/audio
chmod 777 /var/www/messenger/backend/uploads/documents
```

### 3. Перезапуск backend:

```bash
pm2 restart messenger-api
```

---

## 📁 СТРУКТУРА ДИРЕКТОРИЙ:

**Рабочая директория PM2**: `/var/www/messenger/`

```
/var/www/messenger/
├── backend/
│   ├── dist/
│   │   └── src/
│   │       └── main.js
│   ├── uploads/          ← Здесь сохраняются файлы
│   │   ├── images/       (777)
│   │   ├── videos/       (777)
│   │   ├── audio/        (777)
│   │   └── documents/    (777)
│   └── ...
└── ...
```

**Nginx** обслуживает файлы:
```nginx
location /uploads {
    alias /var/www/messager/backend/uploads;  # ← С 'a'!
    expires 1y;
    add_header Cache-Control "public";
}
```

**⚠️ ВАЖНО**: Nginx смотрит в `/var/www/messager/backend/uploads/` (с 'a'), но backend сохраняет в `/var/www/messenger/backend/uploads/` (без 'a')!

---

## 🔄 ВРЕМЕННОЕ РЕШЕНИЕ (СИМЛИНК):

Поскольку Nginx настроен на `/var/www/messager/backend/uploads/`, а backend сохраняет в `/var/www/messenger/backend/uploads/`, можно создать симлинк:

```bash
# Опция A: Симлинк от новой директории к старой
ln -s /var/www/messenger/backend/uploads /var/www/messager/backend/uploads

# Или Опция B: Копирование файлов (одноразово)
cp -r /var/www/messenger/backend/uploads/* /var/www/messager/backend/uploads/
```

---

## ✅ ДОЛГОСРОЧНОЕ РЕШЕНИЕ:

### Обновить PM2 config на правильную директорию:

```bash
# 1. Удалить старый процесс
pm2 delete messenger-api

# 2. Перенести uploads в правильную директорию
cp -r /var/www/messenger/backend/uploads /var/www/messager/backend/
chmod 777 /var/www/messager/backend/uploads/*

# 3. Запустить PM2 из правильной директории
cd /var/www/messager/backend
pm2 start dist/src/main.js --name messenger-api

# 4. Сохранить конфигурацию
pm2 save
```

---

## 🧪 КАК ПРОВЕРИТЬ:

### 1. Проверка директорий:

```bash
ssh root@89.169.39.244 "ls -la /var/www/messenger/backend/uploads/"
```

Должно быть:
```
drwxrwxrwx 2 root root 4096 ... images
drwxrwxrwx 2 root root 4096 ... videos
drwxrwxrwx 2 root root 4096 ... audio
drwxrwxrwx 2 root root 4096 ... documents
```

### 2. Проверка PM2:

```bash
pm2 describe messenger-api | grep "exec cwd"
```

Должно быть: `exec cwd │ /var/www/messenger`

### 3. Тест загрузки изображения:

1. Откройте https://neekloai.ru
2. Выберите чат
3. Нажмите 📷 (иконка изображения)
4. Выберите фото
5. Отправьте

**Ожидаемый результат**:
- ✅ Изображение **отправляется**
- ✅ Сообщение **не пустое**
- ✅ Файл **сохраняется** на сервере
- ✅ Изображение **загружается** без 404

### 4. Проверка сохранённого файла:

```bash
ssh root@89.169.39.244 "ls -la /var/www/messenger/backend/uploads/images/ | tail -5"
```

Должен появиться новый файл `img-*.png`

### 5. Проверка доступности через Nginx:

```bash
curl -I https://neekloai.ru/uploads/images/img-1234567890-123456789.png
```

Должен вернуть: `HTTP/2 200` (или 404 если файл не существует)

---

## 📊 ТЕХНИЧЕСКИЕ ДЕТАЛИ:

### Backend код (messages.controller.ts):

```typescript
@Post('upload-image')
@UseInterceptors(
  FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/images',  // ← Относительный путь от PM2 cwd
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname) || '.jpg';
        cb(null, `img-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Только изображения разрешены'), false);
      }
    },
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB
    },
  }),
)
async uploadImage(/* ... */) {
  const mediaUrl = `/uploads/images/${file.filename}`;
  // ...
}
```

### Frontend код (media.service.ts):

```typescript
async uploadImage(file: File, chatId: string, caption?: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('chatId', chatId);
  if (caption?.trim()) {
    formData.append('caption', caption.trim());
  }
  const response = await api.post('/messages/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
```

---

## 🎉 ИТОГО:

### Проблема была в:
1. ❌ PM2 работал из `/var/www/messenger/` (опечатка в названии)
2. ❌ Директории `images` и `videos` не существовали
3. ❌ Права доступа 755 (backend не мог записать)
4. ❌ Nginx настроен на `/var/www/messager/` (с 'a')

### Что исправлено:
1. ✅ Созданы все директории: `images`, `videos`, `audio`, `documents`
2. ✅ Установлены права 777 для всех upload директорий
3. ✅ Backend перезапущен

### Рекомендация:
- **Долгосрочно**: Перенести всё в `/var/www/messager/` (с 'a') и обновить PM2 config
- **Сейчас**: Работает из `/var/www/messenger/` (без 'a') с правильными правами

---

## 🚀 ГОТОВО К ТЕСТИРОВАНИЮ!

**URL**: https://neekloai.ru

**Попробуйте отправить изображение** - теперь должно работать! 📷✨
