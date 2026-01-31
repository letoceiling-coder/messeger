# Этап 10 — Контекстное меню и редактирование (частично) ⏳

Дата: 2026-01-30

---

## ✅ Выполнено (Backend):

### 10.1 API для редактирования сообщений ✅

**Backend:**
- ✅ DTO: `UpdateMessageDto` (валидация контента)
- ✅ Controller: `PATCH /messages/:id` endpoint
- ✅ Service: метод `updateMessage()`  
- ✅ WebSocket: событие `message:edited`

**Файлы:**
- `backend/src/messages/dto/update-message.dto.ts` (новый)
- `backend/src/messages/messages.controller.ts` (обновлён)
- `backend/src/messages/messages.service.ts` (обновлён)
- `backend/src/websocket/websocket.gateway.ts` (обновлён)

---

## ✅ Выполнено (Frontend - частично):

### WebSocket обработчик ✅
```typescript
const handleMessageEdited = (data) => {
  setMessages(prev =>
    prev.map(m =>
      m.id === data.id
        ? { ...m, content: data.content, isEdited: data.isEdited }
        : m
    )
  );
};

socket.on('message:edited', handleMessageEdited);
```

### API клиент ✅
```typescript
async updateMessage(messageId: string, content: string): Promise<Message> {
  const response = await api.patch<Message>(`/messages/${messageId}`, { content });
  return response.data;
}
```

### Состояние ✅
```typescript
const [editingMessage, setEditingMessage] = useState<Message | null>(null);
```

---

## ⏳ Осталось доделать:

### 10.2 UI для редактирования
- [ ] Показывать баннер "Редактирование" над MessageInputBar
- [ ] Заполнять textarea текстом редактируемого сообщения
- [ ] Кнопка "Отмена" для отмены редактирования
- [ ] Обновление сообщения при нажатии "Отправить"

### 10.3 Контекстное меню
- [ ] Добавить пункт "Редактировать" (только для текстовых своих сообщений)
- [ ] Добавить пункт "Копировать текст"
- [ ] Улучшить UI: токены цветов, иконки
- [ ] Разделители между группами пунктов

### 10.4 Отображение "изменено"
- [ ] Показывать метку "(изменено)" на отредактированных сообщениях

---

## Примеры кода для завершения:

### Контекстное меню (улучшенное):
```tsx
<div className="fixed z-50 min-w-[180px] py-1 rounded-xl 
                bg-app-surface border border-app-border shadow-2xl">
  
  {/* Копировать */}
  <button className="w-full px-4 py-3 text-left text-sm text-app-text 
                     hover:bg-app-surface-hover flex items-center gap-3">
    <svg className="w-4 h-4">...</svg>
    Копировать
  </button>
  
  {/* Ответить */}
  <button className="w-full px-4 py-3 text-left text-sm text-app-text 
                     hover:bg-app-surface-hover flex items-center gap-3">
    <svg className="w-4 h-4">...</svg>
    Ответить
  </button>
  
  {/* Разделитель */}
  <div className="h-px bg-app-border my-1"></div>
  
  {/* Редактировать (только свои текстовые) */}
  {isOwn && message.messageType === 'text' && (
    <button className="w-full px-4 py-3 text-left text-sm text-app-text 
                       hover:bg-app-surface-hover flex items-center gap-3">
      <svg className="w-4 h-4">...</svg>
      Редактировать
    </button>
  )}
  
  {/* Переслать */}
  <button className="w-full px-4 py-3 text-left text-sm text-app-text 
                     hover:bg-app-surface-hover flex items-center gap-3">
    <svg className="w-4 h-4">...</svg>
    Переслать
  </button>
  
  <div className="h-px bg-app-border my-1"></div>
  
  {/* Удалить */}
  {isOwn && (
    <>
      <button className="w-full px-4 py-3 text-left text-sm text-app-text 
                         hover:bg-app-surface-hover flex items-center gap-3">
        <svg className="w-4 h-4">...</svg>
        Удалить у меня
      </button>
      <button className="w-full px-4 py-3 text-left text-sm text-app-error 
                         hover:bg-app-error/10 flex items-center gap-3">
        <svg className="w-4 h-4">...</svg>
        Удалить у всех
      </button>
    </>
  )}
</div>
```

### UI редактирования:
```tsx
{editingMessage && (
  <div className="flex-none px-4 py-2 bg-app-surface-hover border-b border-app-border">
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-app-text-secondary">Редактирование</p>
        <p className="text-sm text-app-text truncate">{editingMessage.content}</p>
      </div>
      <button
        onClick={() => setEditingMessage(null)}
        className="ml-2 p-2 text-app-text-secondary hover:text-app-text"
      >
        ✕
      </button>
    </div>
  </div>
)}
```

### Логика отправки:
```typescript
const handleSend = async () => {
  if (editingMessage) {
    // Редактирование
    try {
      await messagesService.updateMessage(editingMessage.id, newMessage);
      setNewMessage('');
      setEditingMessage(null);
    } catch {
      showError('Не удалось отредактировать');
    }
  } else {
    // Обычная отправка...
  }
};
```

### Отображение метки:
```tsx
<p className="text-sm whitespace-pre-wrap break-words">
  {message.content}
</p>
{message.isEdited && (
  <span className="text-xs text-app-text-secondary ml-2">(изменено)</span>
)}
```

---

## Следующие шаги:

1. Завершить UI редактирования
2. Обновить контекстное меню
3. Добавить копирование
4. Тестирование

Продолжим на следующем этапе!
