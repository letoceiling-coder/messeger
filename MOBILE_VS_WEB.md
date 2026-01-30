# ОТЛИЧИЯ WEB / MOBILE ПРИЛОЖЕНИЙ

## ОБЩИЕ ОТЛИЧИЯ

### 1. ПЛАТФОРМА И ТЕХНОЛОГИИ

**Web:**
- React DOM для рендеринга в браузере
- Vite как сборщик
- Работает в браузере (Chrome, Firefox, Safari)
- HTML/CSS для стилизации
- TailwindCSS для стилей

**Mobile (Expo):**
- React Native для рендеринга нативных компонентов
- Expo как фреймворк и инструменты
- Работает на Android/iOS устройствах
- Нативные компоненты (View, Text, ScrollView)
- StyleSheet API для стилизации (аналог CSS)

---

### 2. НАВИГАЦИЯ

**Web:**
- React Router для навигации
- URL-based routing (`/login`, `/chat/:id`)
- История браузера (back/forward)
- Ссылки и редиректы

**Mobile:**
- React Navigation для навигации
- Stack-based navigation (стек экранов)
- Навигация через методы (`navigation.navigate()`)
- Нет URL, есть только экраны

---

### 3. СТИЛИЗАЦИЯ

**Web:**
```tsx
// TailwindCSS классы
<div className="flex items-center justify-center bg-gray-50">
  <button className="px-4 py-2 bg-indigo-600 text-white rounded">
    Click
  </button>
</div>
```

**Mobile:**
```tsx
// StyleSheet API
<View style={styles.container}>
  <TouchableOpacity style={styles.button}>
    <Text style={styles.buttonText}>Click</Text>
  </TouchableOpacity>
</View>

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4f46e5',
    borderRadius: 8,
  },
});
```

---

### 4. КОМПОНЕНТЫ

**Web:**
- HTML элементы: `<div>`, `<button>`, `<input>`, `<form>`
- Семантические теги
- События: `onClick`, `onChange`, `onSubmit`

**Mobile:**
- React Native компоненты: `<View>`, `<TouchableOpacity>`, `<TextInput>`, `<ScrollView>`
- Нет семантических тегов
- События: `onPress`, `onChangeText`, `onSubmitEditing`

---

### 5. ХРАНЕНИЕ ДАННЫХ

**Web:**
- `localStorage` для простого хранения
- Синхронный API
- Хранит только строки

**Mobile:**
- `AsyncStorage` (Expo) или `@react-native-async-storage/async-storage`
- Асинхронный API (Promise-based)
- Хранит только строки (JSON.stringify/parse)

---

### 6. HTTP ЗАПРОСЫ

**Web:**
- Axios работает одинаково
- Fetch API доступен
- CORS настройки важны

**Mobile:**
- Axios работает одинаково
- Fetch API доступен
- CORS не нужен (нативное приложение)

---

### 7. WEBSOCKET

**Web:**
- Socket.io-client работает в браузере
- WebSocket API браузера
- Автоматическое переподключение

**Mobile:**
- Socket.io-client работает в React Native
- Использует нативные WebSocket
- Требуется явная настройка транспортов: `transports: ['websocket']`

---

### 8. РАЗМЕРЫ И ОТЗЫВЧИВОСТЬ

**Web:**
- Пиксели (px) или относительные единицы (rem, em, %)
- Media queries для адаптивности
- Flexbox и Grid

**Mobile:**
- Density-independent pixels (dp)
- Flexbox только
- Dimensions API для размеров экрана
- SafeAreaView для учета вырезов экрана

---

### 9. КЛАВИАТУРА

**Web:**
- Автоматическое управление фокусом
- `onFocus`, `onBlur` события
- Нет специальной обработки клавиатуры

**Mobile:**
- `KeyboardAvoidingView` для поднятия контента
- `Keyboard` API для управления клавиатурой
- `onFocus`, `onBlur` события
- Важно скрывать клавиатуру при необходимости

---

### 10. НАВИГАЦИЯ И ЖЕСТЫ

**Web:**
- Клики мышью
- Тач-события (touchstart, touchend)
- Скролл колесиком мыши

**Mobile:**
- Тач-жесты (tap, swipe, pinch)
- Нативный скролл (ScrollView)
- Pull-to-refresh
- Swipe-back навигация (iOS)

---

### 11. СТАТУС БАР И БЕЗОПАСНЫЕ ОБЛАСТИ

**Web:**
- Нет статус-бара
- Нет безопасных областей

**Mobile:**
- `StatusBar` компонент для управления
- `SafeAreaView` для учета вырезов (notch)
- Важно для iOS и современных Android

---

### 12. ПРОИЗВОДИТЕЛЬНОСТЬ

**Web:**
- Виртуальный DOM
- Перерисовка при изменениях
- Зависит от производительности браузера

**Mobile:**
- Нативные компоненты
- Более высокая производительность
- Плавная анимация 60 FPS
- Важна оптимизация списков (FlatList)

---

## ПРАКТИЧЕСКИЕ ОТЛИЧИЯ В КОДЕ

### Навигация

**Web:**
```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/chat/123');
```

**Mobile:**
```tsx
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();
navigation.navigate('Chat', { chatId: '123' });
```

---

### Хранение токена

**Web:**
```tsx
localStorage.setItem('accessToken', token);
const token = localStorage.getItem('accessToken');
```

**Mobile:**
```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.setItem('accessToken', token);
const token = await AsyncStorage.getItem('accessToken');
```

---

### Стилизация

**Web:**
```tsx
<button className="px-4 py-2 bg-blue-500 text-white">
  Click
</button>
```

**Mobile:**
```tsx
<TouchableOpacity style={styles.button}>
  <Text style={styles.text}>Click</Text>
</TouchableOpacity>

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
  },
  text: {
    color: 'white',
  },
});
```

---

### Ввод текста

**Web:**
```tsx
<input
  type="text"
  value={text}
  onChange={(e) => setText(e.target.value)}
/>
```

**Mobile:**
```tsx
<TextInput
  value={text}
  onChangeText={setText}
  style={styles.input}
/>
```

---

### Список элементов

**Web:**
```tsx
<div>
  {items.map(item => <div key={item.id}>{item.name}</div>)}
</div>
```

**Mobile:**
```tsx
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <Text>{item.name}</Text>}
/>
```

---

## ИТОГОВЫЕ РАЗЛИЧИЯ

| Аспект | Web | Mobile |
|--------|-----|--------|
| Рендеринг | DOM | Нативные компоненты |
| Стили | CSS/TailwindCSS | StyleSheet API |
| Навигация | React Router (URL) | React Navigation (Stack) |
| Хранение | localStorage | AsyncStorage |
| Компоненты | HTML элементы | React Native компоненты |
| События | onClick, onChange | onPress, onChangeText |
| Клавиатура | Автоматически | KeyboardAvoidingView |
| Безопасные области | Нет | SafeAreaView |
| Производительность | Зависит от браузера | Высокая (нативные) |
| Список | map() | FlatList |

---

## ОБЩЕЕ

**Что одинаково:**
- React логика и хуки
- State management (useState, useEffect)
- Context API
- TypeScript типы
- API сервисы (Axios)
- WebSocket клиент (Socket.io)
- Бизнес-логика

**Что отличается:**
- Компоненты UI
- Стилизация
- Навигация
- Хранение данных
- Обработка событий
- Платформенные особенности
