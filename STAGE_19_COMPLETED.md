# Этап 19 — Статус "печатает..." ✅

Дата завершения: 2026-01-30

---

## ✅ Этап 19: Статус "печатает..." (✏️)

### 19.1 Backend WebSocket для typing ✅

**Реализовано:**

#### DTO `TypingDto`:
```typescript
export class TypingDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;
}
```

#### WebSocket события:
```typescript
@SubscribeMessage('typing:start')
async handleTypingStart(client, data: TypingDto) {
  // Проверка участия в чате
  // Отправка всем участникам (кроме отправителя)
  client.to(`chat:${chatId}`).emit('typing:start', {
    chatId,
    userId: client.userId,
  });
}

@SubscribeMessage('typing:stop')
async handleTypingStop(client, data: TypingDto) {
  // Проверка участия в чате
  // Отправка всем участникам (кроме отправителя)
  client.to(`chat:${chatId}`).emit('typing:stop', {
    chatId,
    userId: client.userId,
  });
}
```

**Особенности:**
- Валидация `chatId`
- Проверка участия в чате (только активные члены)
- Ретрансляция события всем, кроме отправителя
- Логирование для отладки

---

### 19.2 Frontend индикатор в шапке чата ✅

**Состояние:**
```typescript
const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
const typingTimeoutRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
const isTypingRef = useRef(false);
const typingSendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

#### WebSocket слушатели:
```typescript
useEffect(() => {
  socket.on('typing:start', (data) => {
    // Добавить userId в typingUsers
    setTypingUsers(prev => new Set(prev).add(data.userId));
    
    // Автосброс через 3 секунды (если typing:stop не пришёл)
    const timeout = setTimeout(() => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    }, 3000);
    
    typingTimeoutRef.current.set(data.userId, timeout);
  });

  socket.on('typing:stop', (data) => {
    // Очистка таймаута
    clearTimeout(typingTimeoutRef.current.get(data.userId));
    typingTimeoutRef.current.delete(data.userId);
    
    // Удалить userId из typingUsers
    setTypingUsers(prev => {
      const next = new Set(prev);
      next.delete(data.userId);
      return next;
    });
  });
}, [socket, chatId]);
```

#### UI индикатор в шапке:
```tsx
{(() => {
  // Проверка: есть ли печатающие пользователи?
  if (typingUsers.size > 0) {
    const typingMembers = chat?.members.filter(m => typingUsers.has(m.userId));
    
    if (typingMembers && typingMembers.length > 0) {
      // Групповой чат: показать имена
      if (isGroupChat) {
        const names = typingMembers.map(m => m.user.username).join(', ');
        return (
          <span className="text-app-accent flex items-center gap-1">
            <span className="animate-pulse">✏️</span>
            {names} {typingMembers.length > 1 ? 'печатают' : 'печатает'}...
          </span>
        );
      }
      
      // Личный чат: просто "печатает..."
      return (
        <span className="text-app-accent flex items-center gap-1">
          <span className="animate-pulse">✏️</span>
          печатает...
        </span>
      );
    }
  }
  
  // Обычный статус (В сети / был(а))
  // ...
})()}
```

**Визуал:**
- Иконка ✏️ с анимацией `animate-pulse`
- Цвет `text-app-accent` (синий)
- Для групп: "Алекс, Мария печатают..."
- Для личных: "печатает..."

---

### 19.3 Debounce для экономии трафика ✅

**Отправка `typing:start`:**
```typescript
const handleInputChange = (value: string) => {
  setNewMessage(value);

  // Очистка предыдущего таймаута
  if (typingSendTimeoutRef.current) {
    clearTimeout(typingSendTimeoutRef.current);
  }

  if (value.trim().length > 0) {
    // Отправить typing:start только при первом вводе
    if (!isTypingRef.current) {
      sendTypingStart();
    }

    // Автосброс typing:stop через 2 секунды бездействия
    typingSendTimeoutRef.current = setTimeout(() => {
      sendTypingStop();
    }, 2000);
  } else {
    // Поле пустое → сбросить статус
    sendTypingStop();
  }
};
```

**Механика:**
1. **Первый символ:** отправка `typing:start`
2. **Продолжение ввода:** таймаут 2s обновляется
3. **Пауза 2s:** отправка `typing:stop`
4. **Очистка поля:** отправка `typing:stop`

**Экономия:**
- ❌ **БЕЗ debounce:** ~10-20 событий/секунду
- ✅ **С debounce:** ~1-2 события (start + stop)

---

### 19.4 Таймаут автосброса статуса ✅

**Защита от зависания:**

#### На клиенте:
```typescript
// Если typing:stop не пришёл за 3 секунды → автосброс
const timeout = setTimeout(() => {
  setTypingUsers(prev => {
    const next = new Set(prev);
    next.delete(data.userId);
    return next;
  });
  typingTimeoutRef.current.delete(data.userId);
}, 3000);
```

#### При отправке сообщения:
```typescript
const handleSendMessage = async () => {
  sendTypingStop(); // Явная остановка
  // ... отправка сообщения
};

const handleSendMedia = async () => {
  sendTypingStop(); // Явная остановка
  // ... отправка медиа
};
```

**Сценарии:**
- ✅ Пользователь закрыл чат → автосброс через 3s
- ✅ Потеря соединения → автосброс через 3s
- ✅ Отправка сообщения → явная остановка
- ✅ Очистка поля → явная остановка

---

## Технические детали

### Helpers:
```typescript
const sendTypingStart = () => {
  if (!socket || !chatId || isTypingRef.current) return;
  isTypingRef.current = true;
  socket.emit('typing:start', { chatId });
};

const sendTypingStop = () => {
  if (!socket || !chatId || !isTypingRef.current) return;
  isTypingRef.current = false;
  socket.emit('typing:stop', { chatId });
};
```

### Cleanup:
```typescript
return () => {
  // Очистка всех таймаутов при размонтировании
  typingTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
  typingTimeoutRef.current.clear();
};
```

---

## Визуальные примеры

### Личный чат:

**До:**
```
┌────────────────────────┐
│ Алексей               │
│ ● В сети              │
└────────────────────────┘
```

**Во время печати:**
```
┌────────────────────────┐
│ Алексей               │
│ ✏️ печатает...         │ ← анимация pulse
└────────────────────────┘
```

---

### Групповой чат:

**Один печатает:**
```
┌────────────────────────┐
│ Рабочая группа        │
│ ✏️ Мария печатает...   │
└────────────────────────┘
```

**Несколько печатают:**
```
┌────────────────────────┐
│ Рабочая группа        │
│ ✏️ Мария, Алекс, Иван  │
│    печатают...        │
└────────────────────────┘
```

---

## Схема работы

```
User types "П"
      ↓
handleInputChange('П')
      ↓
isTypingRef = false? → sendTypingStart()
      ↓
emit('typing:start', { chatId })
      ↓
Backend: to(`chat:${chatId}`).emit('typing:start', { chatId, userId })
      ↓
Other clients receive → setTypingUsers.add(userId)
      ↓
UI shows: ✏️ печатает...
      ↓
User types "ри"
      ↓
handleInputChange('При') → debounce 2s
      ↓
User types "вет"
      ↓
handleInputChange('Привет') → debounce 2s
      ↓
[pause 2s]
      ↓
Timeout fires → sendTypingStop()
      ↓
emit('typing:stop', { chatId })
      ↓
Other clients receive → setTypingUsers.delete(userId)
      ↓
UI shows: ● В сети
```

---

## Файлы

### Backend:
- `backend/src/websocket/dto/typing.dto.ts` ✨ новый
- `backend/src/websocket/websocket.gateway.ts` (+ 70 строк)

### Frontend:
- `frontend-web/src/pages/ChatPage.tsx` (+ 120 строк)

### Документация:
- `STAGE_19_COMPLETED.md` ✨ новый (этот файл)

---

## Итоги этапов 0-19

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
- **Этап 19** — Статус "печатает..." ✅

### 📊 Статистика:
- **Готовность базового функционала:** ~98% ✅
- **Новых/обновлённых файлов:** 47+
- **Строк кода:** ~4400+

---

## Следующие этапы

### 🔜 Этап 20: Прикрепление документов
- Загрузка файлов (PDF, DOC, DOCX, ZIP, RAR, TXT, etc.)
- Иконки типов файлов
- Отображение размера/названия
- Прогресс загрузки
- Скачивание

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

**Статус проекта:** Статус "печатает..." полностью реализован ✅  
**Готовность:** ~98% базового функционала  
**Следующий фокус:** Документы → Финальные фичи → Mobile

**Мессенджер становится всё более живым!** 🎉✏️
