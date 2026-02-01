# План реализации функционала мобильного приложения

## Статус задач (по приоритету)

### 1. Отправка сообщений ✅
- [x] Дедупликация при получении (message:received приходит дважды)
- [x] audio.service — возвращает response напрямую

### 2. Прикрепить файл ✅
- [x] MessageInput: onAttach → launchImageLibrary
- [x] Загрузка через API upload-image, upload-video
- [x] Добавление сообщения в чат после загрузки

### 3. Запись голосового ⏳
- [ ] VoiceRecorder: переписать на react-native-audio-recorder-player (сейчас expo-av — не установлен)
- [ ] Интеграция в ChatScreen

### 4. Иконки звонка ✅
- [x] ChatScreen header: call + videocam иконки
- [x] Обработчики → navigate Call screen

### 5. Добавление контакта ✅
- [x] ChatsScreen: кнопка "+" → NewChatScreen
- [x] Поиск пользователей (GET /users/search?q=)
- [x] Создание личного чата (POST /chats/direct)

### 6. Удаление сообщения ✅
- [x] MessageItem: onLongPress → Alert (Удалить)
- [x] API DELETE /messages/:id
- [x] Обновление списка после удаления

### 7. Фото/видео в чате ✅
- [x] MessageItem: Image для messageType image
- [x] MessageItem: placeholder для video (иконка play)
- [x] Полный URL через BASE_URL + mediaUrl

### 8. Воспроизведение голосовых ✅
- [x] MessageItem: VoiceMessage для messageType voice
- [x] VoiceMessage: react-native-sound

### 9. Ответ на сообщение ⏳
- [ ] MessageItem: onLongPress → "Ответить"
- [ ] MessageInput: replyTo state
- [ ] sendMessage с replyToId

### 10. Эмодзи ⏳
- [ ] Установить react-native-emoji-selector
- [ ] MessageInput: кнопка смайлика
