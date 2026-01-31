# Этап 20 — Прикрепление документов ✅

Дата завершения: 2026-01-31

---

## ✅ Этап 20: Прикрепление документов (📎)

### 20.1 Backend для загрузки документов ✅

**Реализовано:**

#### Обновлённая схема Prisma:
```prisma
model Message {
  // ... existing fields
  fileName    String?  @map("file_name")
  fileSize    Int?     @map("file_size")
  mimeType    String?  @map("mime_type")
  // ...
}
```

**Новые поля:**
- `fileName` — оригинальное имя файла
- `fileSize` — размер в байтах
- `mimeType` — MIME-тип (application/pdf, text/plain, etc.)

#### DTO `CreateDocumentMessageDto`:
```typescript
export interface CreateDocumentMessageDto {
  chatId: string;
  userId: string;
  documentUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  caption?: string;
}
```

#### Метод в `MessagesService`:
```typescript
async createDocumentMessage(dto: CreateDocumentMessageDto) {
  // Создание сообщения с типом 'document'
  // Сохранение метаданных файла
  // Создание записей доставки
  // Обновление lastMessageAt чата
}
```

#### API эндпоинт:
- `POST /messages/upload-document`
- Принимает: `multipart/form-data` (file, chatId, caption)
- Лимит: **100 MB**
- Папка: `./uploads/documents/`
- Возвращает: `{ message, documentUrl }`

**Поддерживаемые форматы:**
- Документы: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- Текст: TXT
- Архивы: ZIP, RAR, 7Z, TAR, GZ
- Любые другие файлы (без ограничений по типу)

---

### 20.2 Frontend выбор и отправка документов ✅

**Компонент:** `ChatPage.tsx`

#### Состояние:
```typescript
const [selectedDocuments, setSelectedDocuments] = useState<File[]>([]);
const documentInputRef = useRef<HTMLInputElement>(null);
```

#### Handlers:
```typescript
const handleDocumentClick = () => {
  documentInputRef.current?.click();
};

const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  const newDocs = Array.from(files);
  setSelectedDocuments(prev => [...prev, ...newDocs]);
  e.target.value = '';
};

const handleSendDocuments = async () => {
  if (!selectedDocuments.length || !chatId || !user) return;
  setIsSending(true);
  for (const file of selectedDocuments) {
    await messagesService.uploadDocument(chatId, file, newMessage.trim() || undefined);
  }
  setSelectedDocuments([]);
  setNewMessage('');
};
```

#### Метод в `messagesService`:
```typescript
async uploadDocument(chatId: string, file: File, caption?: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('chatId', chatId);
  if (caption) formData.append('caption', caption);
  
  const response = await api.post('/messages/upload-document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  
  return response.data;
}
```

#### UI input:
```tsx
<input
  ref={documentInputRef}
  type="file"
  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,.tar,.gz"
  multiple
  className="hidden"
  onChange={handleDocumentSelect}
/>
```

#### Кнопка выбора:
```tsx
<button
  onClick={handleDocumentClick}
  className="p-3 rounded-full hover:bg-app-surface-hover"
  title="Прикрепить документ"
>
  <svg>📄</svg>
</button>
```

---

### 20.3 Отображение документов в чате ✅

**Компонент:** `DocumentMessage.tsx`

#### Функциональность:
```typescript
const getFileIcon = (mimeType: string): string => {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '📦';
  if (mimeType.includes('text')) return '📃';
  if (mimeType.includes('json') || mimeType.includes('xml')) return '🔧';
  return '📎';
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};
```

#### UI структура:
```tsx
<div className="flex items-center gap-3 p-3 rounded-xl bg-app-surface border">
  {/* Иконка файла (📄 📝 📊 etc.) */}
  <div className="w-12 h-12 rounded-lg bg-app-surface-hover">
    {icon}
  </div>
  
  {/* Информация */}
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium truncate">{fileName}</p>
    <span className="text-xs">{extension} • {fileSize}</span>
  </div>
  
  {/* Кнопка скачивания */}
  <button onClick={handleDownload} className="w-10 h-10 rounded-lg bg-app-accent">
    <svg>⬇️</svg>
  </button>
</div>
```

**Визуал:**
- Иконка зависит от типа файла
- Имя файла с ellipsis (truncate)
- Расширение + размер
- Hover эффект на границе (`border-app-border` → `border-app-accent`)

---

### 20.4 Скачивание документов ✅

**Механика:**
```typescript
const handleDownload = () => {
  const link = document.createElement('a');
  link.href = documentUrl;
  link.download = fileName;
  link.click();
};
```

**Процесс:**
1. Пользователь кликает кнопку скачивания
2. Создаётся временная ссылка `<a>`
3. Устанавливаются `href` и `download` attributes
4. Программный клик → начинается скачивание
5. Браузер сохраняет файл с оригинальным именем

---

## Иконки типов файлов

| Тип файла | Иконка | MIME типы |
|-----------|--------|-----------|
| PDF | 📄 | application/pdf |
| Word | 📝 | application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document |
| Excel | 📊 | application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet |
| PowerPoint | 📈 | application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation |
| Архивы | 📦 | application/zip, application/x-rar-compressed, application/x-7z-compressed |
| Текст | 📃 | text/plain |
| JSON/XML | 🔧 | application/json, application/xml |
| Другое | 📎 | — |

---

## Визуальные примеры

### Выбор документов (перед отправкой):

```
┌─────────────────────────────────┐
│ Документы (2)              [✕]  │
│                                 │
│ 📎 Отчёт_2026.pdf          [✕]  │
│    2.34 MB                      │
│                                 │
│ 📎 Презентация.pptx        [✕]  │
│    5.12 MB                      │
└─────────────────────────────────┘
```

---

### Документ в чате:

```
┌───────────────────────────────┐
│ [📄]  Договор_2026.pdf   [⬇] │
│       PDF • 1.2 MB            │
└───────────────────────────────┘
```

**Hover:**
```
┌───────────────────────────────┐
│ [📄]  Договор_2026.pdf   [⬇] │ ← border становится синим
│       PDF • 1.2 MB            │
└───────────────────────────────┘
```

---

### С подписью:

```
┌───────────────────────────────┐
│ [📝]  Резюме.docx        [⬇] │
│       DOCX • 456 KB           │
└───────────────────────────────┘

Пожалуйста, ознакомьтесь!
                        12:30 ✓✓
```

---

## Технические детали

### Backend:
- **Multer** для обработки multipart/form-data
- **Лимит:** 100 MB per file
- **Папка:** `./uploads/documents/`
- **Именование:** `doc-{timestamp}-{random}.{ext}`

### Frontend:
- **Типы:** `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`, `.txt`, `.zip`, `.rar`, `.7z`, `.tar`, `.gz`
- **Multiple:** да, можно выбирать несколько файлов
- **Превью:** показ списка выбранных файлов с размерами

### Оптимизации:
- Отображение расширения файла в uppercase (PDF, DOCX)
- Форматирование размера (B, KB, MB, GB)
- Tooltip с полным именем файла (title attribute)
- Hover анимация на кнопке скачивания

---

## Файлы

### Backend:
- `backend/prisma/schema.prisma` (+ 3 поля в Message)
- `backend/src/messages/dto/create-document-message.dto.ts` ✨ новый
- `backend/src/messages/messages.service.ts` (+ createDocumentMessage)
- `backend/src/messages/messages.controller.ts` (+ POST /upload-document)
- `backend/uploads/documents/` ✨ новая папка

### Frontend:
- `frontend-web/src/components/DocumentMessage.tsx` ✨ новый (75 строк)
- `frontend-web/src/pages/ChatPage.tsx` (+ 120 строк)
- `frontend-web/src/services/messages.service.ts` (+ uploadDocument)
- `frontend-web/src/types/index.ts` (+ fileName, fileSize, mimeType в Message)

### Документация:
- `STAGE_20_COMPLETED.md` ✨ новый (этот файл)

---

## Схема работы

```
User clicks "Прикрепить документ" 📄
        ↓
handleDocumentClick()
        ↓
documentInputRef.current?.click()
        ↓
File picker opens
        ↓
User selects files (PDF, DOCX, etc.)
        ↓
handleDocumentSelect(files)
        ↓
setSelectedDocuments([...prev, ...newFiles])
        ↓
UI shows selected documents with preview
        ↓
User clicks Send (or presses Enter)
        ↓
handleSendDocuments()
        ↓
for each file:
  POST /messages/upload-document (FormData)
        ↓
Backend: Multer saves to ./uploads/documents/
        ↓
MessagesService.createDocumentMessage()
        ↓
WebSocket: broadcastMessageToChat
        ↓
All clients receive message
        ↓
Render DocumentMessage component
        ↓
User clicks Download button
        ↓
handleDownload() → document.createElement('a') → link.click()
        ↓
Browser downloads file with original name
```

---

## Улучшения в будущем

### Возможные доработки:
1. **Превью документов**
   - PDF: встроенный просмотрщик
   - Office: конвертация в изображения
   - Код: подсветка синтаксиса

2. **Drag & Drop**
   - Перетаскивание файлов в зону чата
   - Визуальная индикация drop zone

3. **Прогресс загрузки**
   - Progress bar для больших файлов
   - Отмена загрузки
   - Retry при ошибке

4. **Сканирование**
   - Антивирус проверка
   - Проверка на вредоносные файлы

5. **Сжатие**
   - Автосжатие больших файлов
   - ZIP архивация нескольких файлов

6. **Превью перед отправкой**
   - Для изображений внутри документов
   - Первая страница PDF как превью

---

## Итоги этапов 0-20

### ✅ Выполнено:
- **Этап 0** — Быстрые победы (UX)
- **Этап 1** — Поле ввода Telegram
- **Этап 2** — Запись аудио
- **Этап 4** — Эмодзи (192 шт)
- **Этап 3+8** — Фото/Видео
- **Этап 11** — Скелетоны
- **Этап 6** — Настройки
- **Этап 5** — Поиск по чатам
- **Этап 7** — Статусы сообщений
- **Этап 9** — Звонки (улучшенный UI)
- **Этап 10** — Редактирование + контекстное меню
- **Этап 12** — Полировка UX
- **Этап 16** — Групповые чаты
- **Этап 17** — Поиск по сообщениям
- **Этап 18** — Реакции на сообщения
- **Этап 19** — Статус "печатает..."
- **Этап 20** — Прикрепление документов ✅

### 📊 Статистика:
- **Готовность базового функционала:** ~99% ✅
- **Новых/обновлённых файлов:** 51+
- **Строк кода:** ~4600+

---

## Следующие этапы

### 🔜 Этап 21: Дополнительный функционал
- Черновики сообщений
- Закрепленные сообщения
- Темы оформления
- Архивация чатов
- Блокировка пользователей

### 🔜 Mobile (React Native)
- Настройка проекта
- Портирование компонентов
- Push уведомления
- Адаптация UI

---

**Статус проекта:** Прикрепление документов полностью реализовано ✅  
**Готовность:** ~99% базового функционала  
**Следующий фокус:** Финальные фичи → Mobile → Полировка

**Мессенджер почти завершён!** 🎉📎
