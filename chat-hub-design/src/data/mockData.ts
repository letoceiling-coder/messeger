import { Chat, Contact, Call, Message, User, Settings } from '@/types/messenger';

// Helper to generate random avatar colors
const avatarColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

const getAvatarColor = (name: string): string => {
  const index = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[index];
};

// Current user
export const currentUser: User = {
  id: 'user-1',
  name: 'Александр Иванов',
  username: 'alex_ivanov',
  phone: '+7 999 123-45-67',
  email: 'alex@example.com',
  dateOfBirth: '1990-05-15',
  bio: 'Разработчик | Москва',
  isOnline: true,
};

// Default settings
export const defaultSettings: Settings = {
  theme: 'light',
  notifications: true,
  sounds: true,
  vibration: true,
  lastSeenPrivacy: 'everyone',
  profilePhotoPrivacy: 'everyone',
  fontSize: 'medium',
};

// Contacts
export const contacts: Contact[] = [
  {
    id: 'contact-1',
    name: 'Мария Петрова',
    username: 'maria_p',
    phone: '+7 999 111-22-33',
    bio: 'Дизайнер UI/UX',
    isOnline: true,
  },
  {
    id: 'contact-2',
    name: 'Дмитрий Смирнов',
    username: 'dmitry_s',
    phone: '+7 999 222-33-44',
    bio: 'Backend Developer',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
  },
  {
    id: 'contact-3',
    name: 'Анна Козлова',
    username: 'anna_k',
    phone: '+7 999 333-44-55',
    isOnline: true,
  },
  {
    id: 'contact-4',
    name: 'Сергей Новиков',
    username: 'sergey_n',
    phone: '+7 999 444-55-66',
    bio: 'Product Manager',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: 'contact-5',
    name: 'Елена Морозова',
    username: 'elena_m',
    phone: '+7 999 555-66-77',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24), // yesterday
  },
  {
    id: 'contact-6',
    name: 'Павел Волков',
    username: 'pavel_v',
    phone: '+7 999 666-77-88',
    bio: 'iOS Developer',
    isOnline: true,
  },
  {
    id: 'contact-7',
    name: 'Ольга Федорова',
    username: 'olga_f',
    phone: '+7 999 777-88-99',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
  },
  {
    id: 'contact-8',
    name: 'Артём Лебедев',
    username: 'artem_l',
    phone: '+7 999 888-99-00',
    bio: 'DevOps Engineer',
    isOnline: true,
  },
  {
    id: 'contact-9',
    name: 'Наталья Соколова',
    username: 'natasha_s',
    phone: '+7 999 999-00-11',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
  },
  {
    id: 'contact-10',
    name: 'Михаил Попов',
    username: 'mikhail_p',
    phone: '+7 999 000-11-22',
    bio: 'Android Developer',
    isOnline: true,
  },
];

// Placeholder для медиа в демо (как в Telegram Desktop — локальные/плейсхолдеры)
const placeholderImage = '/placeholder.svg';
const placeholderVideo = '/media/feed/videos/coding.mp4'; // короткий демо-ролик
const stickerDataUrl = (emoji: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128"><rect fill="%23f0f0f0" width="128" height="128" rx="16"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="64">${emoji}</text></svg>`
  )}`;

// Generate messages for a chat — все типы сообщений по умолчанию (как в Telegram)
const generateMessages = (chatId: string, contactId: string): Message[] => {
  const now = Date.now();

  const messages: Message[] = [
    {
      id: `${chatId}-msg-1`,
      chatId,
      senderId: contactId,
      type: 'text',
      content: 'Привет! Как дела?',
      timestamp: new Date(now - 1000 * 60 * 60 * 2),
      status: 'read',
      isOutgoing: false,
    },
    {
      id: `${chatId}-msg-2`,
      chatId,
      senderId: 'user-1',
      type: 'text',
      content: 'Привет! Всё отлично, работаю над новым проектом 💻',
      timestamp: new Date(now - 1000 * 60 * 60 * 1.9),
      status: 'read',
      isOutgoing: true,
    },
    {
      id: `${chatId}-msg-3`,
      chatId,
      senderId: contactId,
      type: 'text',
      content: 'Круто! Что за проект?',
      timestamp: new Date(now - 1000 * 60 * 60 * 1.8),
      status: 'read',
      isOutgoing: false,
    },
    {
      id: `${chatId}-msg-4`,
      chatId,
      senderId: 'user-1',
      type: 'text',
      content: 'Делаю мессенджер в стиле Telegram, хочу показать как можно красиво реализовать интерфейс',
      timestamp: new Date(now - 1000 * 60 * 60 * 1.7),
      status: 'read',
      isOutgoing: true,
    },
    {
      id: `${chatId}-msg-5`,
      chatId,
      senderId: contactId,
      type: 'text',
      content: 'Звучит интересно! Покажешь когда будет готово?',
      timestamp: new Date(now - 1000 * 60 * 30),
      status: 'read',
      isOutgoing: false,
    },
    {
      id: `${chatId}-msg-6`,
      chatId,
      senderId: 'user-1',
      type: 'text',
      content: 'Конечно! Уже скоро 🚀',
      timestamp: new Date(now - 1000 * 60 * 25),
      status: 'delivered',
      isOutgoing: true,
    },
    // Фото (image)
    {
      id: `${chatId}-msg-img`,
      chatId,
      senderId: contactId,
      type: 'image',
      content: 'Фото',
      timestamp: new Date(now - 1000 * 60 * 24),
      status: 'read',
      isOutgoing: false,
      mediaUrl: placeholderImage,
    },
    {
      id: `${chatId}-msg-img-out`,
      chatId,
      senderId: 'user-1',
      type: 'image',
      content: 'Фото',
      timestamp: new Date(now - 1000 * 60 * 22),
      status: 'read',
      isOutgoing: true,
      mediaUrl: placeholderImage,
    },
    // Видео (video)
    {
      id: `${chatId}-msg-video`,
      chatId,
      senderId: 'user-1',
      type: 'video',
      content: 'Видео',
      timestamp: new Date(now - 1000 * 60 * 21),
      status: 'delivered',
      isOutgoing: true,
      mediaUrl: placeholderVideo,
    },
    // Стикер (sticker)
    {
      id: `${chatId}-msg-sticker`,
      chatId,
      senderId: contactId,
      type: 'sticker',
      content: 'Стикер',
      timestamp: new Date(now - 1000 * 60 * 20),
      status: 'read',
      isOutgoing: false,
      mediaUrl: stickerDataUrl('😊'),
      stickerId: 's1-9',
      stickerPackId: 'pack-1',
    },
    {
      id: `${chatId}-msg-sticker-out`,
      chatId,
      senderId: 'user-1',
      type: 'sticker',
      content: 'Стикер',
      timestamp: new Date(now - 1000 * 60 * 19),
      status: 'read',
      isOutgoing: true,
      mediaUrl: stickerDataUrl('👍'),
      stickerId: 's1-5',
      stickerPackId: 'pack-1',
    },
    // Голосовое сообщение (voice)
    {
      id: `${chatId}-msg-voice`,
      chatId,
      senderId: contactId,
      type: 'voice',
      content: 'Голосовое сообщение',
      timestamp: new Date(now - 1000 * 60 * 20),
      status: 'read',
      isOutgoing: false,
      duration: 12,
      waveform: Array.from({ length: 48 }, () => Math.random() * 0.6 + 0.2),
      isPlayed: true,
    },
    {
      id: `${chatId}-msg-voice-out`,
      chatId,
      senderId: 'user-1',
      type: 'voice',
      content: 'Голосовое сообщение',
      timestamp: new Date(now - 1000 * 60 * 18),
      status: 'read',
      isOutgoing: true,
      duration: 8,
      waveform: Array.from({ length: 48 }, () => Math.random() * 0.5 + 0.3),
    },
    // Видеокружок (video_note)
    {
      id: `${chatId}-msg-videonote`,
      chatId,
      senderId: 'user-1',
      type: 'video_note',
      content: 'Видеокружок',
      timestamp: new Date(now - 1000 * 60 * 15),
      status: 'delivered',
      isOutgoing: true,
      duration: 5,
      videoNoteDuration: 5,
      mediaUrl: placeholderVideo,
    },
    // Файл (file)
    {
      id: `${chatId}-msg-file`,
      chatId,
      senderId: contactId,
      type: 'file',
      content: 'Документ',
      timestamp: new Date(now - 1000 * 60 * 13),
      status: 'read',
      isOutgoing: false,
      fileName: 'Отчёт_Q4.pdf',
      fileSize: 1024 * 512,
    },
    {
      id: `${chatId}-msg-file-out`,
      chatId,
      senderId: 'user-1',
      type: 'file',
      content: 'Архив',
      timestamp: new Date(now - 1000 * 60 * 12),
      status: 'read',
      isOutgoing: true,
      fileName: 'project.zip',
      fileSize: 1024 * 1024 * 2,
    },
    // Контакт (contact)
    {
      id: `${chatId}-msg-contact`,
      chatId,
      senderId: 'user-1',
      type: 'contact',
      content: 'Контакт',
      timestamp: new Date(now - 1000 * 60 * 11),
      status: 'read',
      isOutgoing: true,
      contactName: 'Анна Козлова',
      contactPhone: '+7 999 333-44-55',
    },
    {
      id: `${chatId}-msg-contact-in`,
      chatId,
      senderId: contactId,
      type: 'contact',
      content: 'Контакт',
      timestamp: new Date(now - 1000 * 60 * 10),
      status: 'read',
      isOutgoing: false,
      contactName: 'Сергей Новиков',
      contactPhone: '+7 999 444-55-66',
    },
    // Системное сообщение (system)
    {
      id: `${chatId}-msg-sys`,
      chatId,
      senderId: 'system',
      type: 'system',
      content: 'Звонок завершён',
      timestamp: new Date(now - 1000 * 60 * 14),
      status: 'read',
      isOutgoing: false,
    },
  ];

  return messages;
};

// Сообщения в чате с ботом (команды, ответы бота)
const generateBotMessages = (chatId: string, botId: string): Message[] => {
  const now = Date.now();
  return [
    {
      id: `${chatId}-msg-1`,
      chatId,
      senderId: 'user-1',
      type: 'text',
      content: '/start',
      timestamp: new Date(now - 1000 * 60 * 60 * 2),
      status: 'read',
      isOutgoing: true,
    },
    {
      id: `${chatId}-msg-2`,
      chatId,
      senderId: botId,
      type: 'text',
      content: 'Привет! Я бот. Выберите команду или нажмите кнопку:',
      timestamp: new Date(now - 1000 * 60 * 60 * 1.98),
      status: 'read',
      isOutgoing: false,
      buttons: [
        { type: 'inline', label: '/help', action: 'help' },
        { type: 'inline', label: '/weather', action: 'weather' },
        { type: 'url', label: 'Подробнее на сайте', url: 'https://example.com' },
      ],
    },
    {
      id: `${chatId}-msg-3`,
      chatId,
      senderId: 'user-1',
      type: 'text',
      content: '/weather',
      timestamp: new Date(now - 1000 * 60 * 60 * 1.5),
      status: 'read',
      isOutgoing: true,
    },
    {
      id: `${chatId}-msg-4`,
      chatId,
      senderId: botId,
      type: 'text',
      content: '☀️ Москва: +3°C, ясно. Ветер 2 м/с. Завтра до +5°C.',
      timestamp: new Date(now - 1000 * 60 * 60 * 1.48),
      status: 'read',
      isOutgoing: false,
      buttons: [
        { type: 'reply', label: 'Другой город', action: 'other_city' },
        { type: 'reply', label: 'Обновить', action: 'refresh' },
      ],
    },
    {
      id: `${chatId}-msg-5`,
      chatId,
      senderId: 'user-1',
      type: 'text',
      content: 'Спасибо!',
      timestamp: new Date(now - 1000 * 60 * 30),
      status: 'read',
      isOutgoing: true,
    },
    {
      id: `${chatId}-msg-6`,
      chatId,
      senderId: botId,
      type: 'text',
      content: 'Пожалуйста! Если нужна погода в другом городе — напиши название.',
      timestamp: new Date(now - 1000 * 60 * 28),
      status: 'read',
      isOutgoing: false,
    },
  ];
};

// Сообщения помощника (второй бот)
const generateHelperBotMessages = (chatId: string, botId: string): Message[] => {
  const now = Date.now();
  return [
    {
      id: `${chatId}-msg-1`,
      chatId,
      senderId: 'user-1',
      type: 'text',
      content: '/start',
      timestamp: new Date(now - 1000 * 60 * 60 * 24),
      status: 'read',
      isOutgoing: true,
    },
    {
      id: `${chatId}-msg-2`,
      chatId,
      senderId: botId,
      type: 'text',
      content: 'Здравствуйте! Я Помощник. Выберите опцию:',
      timestamp: new Date(now - 1000 * 60 * 60 * 23.98),
      status: 'read',
      isOutgoing: false,
      buttons: [
        { type: 'inline', label: 'Настройки', action: 'settings' },
        { type: 'inline', label: 'Частые вопросы', action: 'faq' },
        { type: 'url', label: 'Перейти на сайт', url: 'https://example.com/support' },
      ],
    },
    {
      id: `${chatId}-msg-3`,
      chatId,
      senderId: 'user-1',
      type: 'text',
      content: 'Как отключить уведомления в группе?',
      timestamp: new Date(now - 1000 * 60 * 60 * 20),
      status: 'read',
      isOutgoing: true,
    },
    {
      id: `${chatId}-msg-4`,
      chatId,
      senderId: botId,
      type: 'text',
      content: 'Зажмите название чата в списке → «Отключить уведомления» или свайпните чат влево и нажмите «Звук выкл».',
      timestamp: new Date(now - 1000 * 60 * 60 * 19.98),
      status: 'read',
      isOutgoing: false,
    },
  ];
};

// Посты канала с просмотрами, реакциями и комментариями (как в Telegram)
const generateChannelMessages = (chatId: string, _channelName: string): Message[] => {
  const now = Date.now();
  const post1 = `${chatId}-post-1`;
  const post2 = `${chatId}-post-2`;
  return [
    {
      id: post1,
      chatId,
      senderId: chatId,
      type: 'text',
      content: 'Релиз React 19: улучшенный компайлер, Actions, use() и многое другое. Подробности в блоге.',
      timestamp: new Date(now - 1000 * 60 * 60 * 2),
      status: 'read',
      isOutgoing: false,
      views: 1247,
      reactions: [
        { emoji: '👍', count: 89, userIds: [] },
        { emoji: '❤️', count: 42, userIds: [] },
        { emoji: '😂', count: 31, userIds: [] },
      ],
    },
    {
      id: `${chatId}-comment-1`,
      chatId,
      senderId: 'user-1',
      type: 'text',
      content: 'Уже обновился, всё летает!',
      timestamp: new Date(now - 1000 * 60 * 60 * 1.9),
      status: 'read',
      isOutgoing: true,
      replyTo: post1,
    },
    {
      id: `${chatId}-comment-2`,
      chatId,
      senderId: 'contact-2',
      type: 'text',
      content: 'Спасибо за пост, ждал use()',
      timestamp: new Date(now - 1000 * 60 * 60 * 1.8),
      status: 'read',
      isOutgoing: false,
      replyTo: post1,
    },
    {
      id: post2,
      chatId,
      senderId: chatId,
      type: 'image',
      content: 'Скриншот интерфейса',
      timestamp: new Date(now - 1000 * 60 * 60 * 5),
      status: 'read',
      isOutgoing: false,
      mediaUrl: placeholderImage,
      views: 892,
      reactions: [
        { emoji: '👍', count: 56, userIds: [] },
        { emoji: '😮', count: 12, userIds: [] },
      ],
    },
    {
      id: `${chatId}-post-3`,
      chatId,
      senderId: chatId,
      type: 'text',
      content: 'TypeScript 5.6 вышел в бета: улучшения производительности и новые проверки типов.',
      timestamp: new Date(now - 1000 * 60 * 60 * 8),
      status: 'read',
      isOutgoing: false,
      views: 534,
      reactions: [
        { emoji: '👍', count: 28, userIds: [] },
      ],
    },
    {
      id: `${chatId}-post-4`,
      chatId,
      senderId: chatId,
      type: 'text',
      content: 'Как настроить CI/CD за 10 минут: гайд для небольших команд.',
      timestamp: new Date(now - 1000 * 60 * 60 * 24),
      status: 'read',
      isOutgoing: false,
      views: 210,
      reactions: [
        { emoji: '😢', count: 15, userIds: [] },
        { emoji: '👍', count: 8, userIds: [] },
      ],
    },
  ];
};

// Посты второго канала с просмотрами и реакциями
const generateNewsChannelMessages = (chatId: string): Message[] => {
  const now = Date.now();
  return [
    {
      id: `${chatId}-post-1`,
      chatId,
      senderId: chatId,
      type: 'text',
      content: 'Главное за сегодня: курс рубля, погода в регионах, события в мире IT.',
      timestamp: new Date(now - 1000 * 60 * 60 * 1),
      status: 'read',
      isOutgoing: false,
      views: 3420,
      reactions: [
        { emoji: '👍', count: 156, userIds: [] },
        { emoji: '😂', count: 44, userIds: [] },
      ],
    },
    {
      id: `${chatId}-post-2`,
      chatId,
      senderId: chatId,
      type: 'text',
      content: '📊 Рынки закрылись в плюсе. Технологический сектор вырос на 1.2%.',
      timestamp: new Date(now - 1000 * 60 * 60 * 12),
      status: 'read',
      isOutgoing: false,
      views: 1890,
      reactions: [
        { emoji: '😮', count: 78, userIds: [] },
        { emoji: '👍', count: 32, userIds: [] },
      ],
    },
    {
      id: `${chatId}-post-3`,
      chatId,
      senderId: chatId,
      type: 'image',
      content: 'Инфографика дня',
      timestamp: new Date(now - 1000 * 60 * 60 * 24),
      status: 'read',
      isOutgoing: false,
      mediaUrl: placeholderImage,
      views: 756,
      reactions: [
        { emoji: '❤️', count: 21, userIds: [] },
      ],
    },
  ];
};

// Chats
export const chats: Chat[] = [
  {
    id: 'chat-1',
    name: 'Мария Петрова',
    isGroup: false,
    unreadCount: 2,
    isPinned: true,
    isMuted: false,
    isArchived: false,
    isOnline: true,
    lastMessage: {
      id: 'last-1',
      chatId: 'chat-1',
      senderId: 'contact-1',
      type: 'text',
      content: 'Отлично! Тогда до встречи завтра 😊',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      status: 'delivered',
      isOutgoing: false,
    },
  },
  {
    id: 'chat-2',
    name: 'Команда разработки',
    isGroup: true,
    unreadCount: 5,
    isPinned: true,
    isMuted: false,
    isArchived: false,
    members: ['contact-2', 'contact-4', 'contact-6', 'contact-8'],
    lastMessage: {
      id: 'last-2',
      chatId: 'chat-2',
      senderId: 'contact-2',
      type: 'text',
      content: 'Дмитрий: Деплой прошёл успешно! ✅',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      status: 'delivered',
      isOutgoing: false,
    },
  },
  {
    id: 'chat-3',
    name: 'Дмитрий Смирнов',
    isGroup: false,
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 30),
    lastMessage: {
      id: 'last-3',
      chatId: 'chat-3',
      senderId: 'user-1',
      type: 'text',
      content: 'Хорошо, посмотрю код вечером',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      status: 'read',
      isOutgoing: true,
    },
  },
  {
    id: 'chat-4',
    name: 'Анна Козлова',
    isGroup: false,
    unreadCount: 1,
    isPinned: false,
    isMuted: true,
    isArchived: false,
    isOnline: true,
    lastMessage: {
      id: 'last-4',
      chatId: 'chat-4',
      senderId: 'contact-3',
      type: 'voice',
      content: 'Голосовое сообщение',
      duration: 15,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: 'delivered',
      isOutgoing: false,
    },
  },
  {
    id: 'chat-5',
    name: 'Сергей Новиков',
    isGroup: false,
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2),
    lastMessage: {
      id: 'last-5',
      chatId: 'chat-5',
      senderId: 'user-1',
      type: 'image',
      content: 'Фото',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      status: 'read',
      isOutgoing: true,
    },
  },
  {
    id: 'chat-6',
    name: 'Проект X',
    isGroup: true,
    unreadCount: 0,
    isPinned: false,
    isMuted: true,
    isArchived: false,
    members: ['contact-1', 'contact-3', 'contact-5'],
    lastMessage: {
      id: 'last-6',
      chatId: 'chat-6',
      senderId: 'contact-1',
      type: 'text',
      content: 'Мария: Макеты готовы, отправляю в Figma',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      status: 'read',
      isOutgoing: false,
    },
  },
  {
    id: 'chat-7',
    name: 'Елена Морозова',
    isGroup: false,
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24),
    lastMessage: {
      id: 'last-7',
      chatId: 'chat-7',
      senderId: 'contact-5',
      type: 'text',
      content: 'Спасибо за помощь!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
      status: 'read',
      isOutgoing: false,
    },
  },
  {
    id: 'chat-8',
    name: 'Павел Волков',
    isGroup: false,
    unreadCount: 3,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    isOnline: true,
    lastMessage: {
      id: 'last-8',
      chatId: 'chat-8',
      senderId: 'contact-6',
      type: 'file',
      content: 'project.zip',
      fileName: 'project.zip',
      fileSize: 15000000,
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      status: 'delivered',
      isOutgoing: false,
    },
  },
  // Боты (с клавиатурой: кнопки #25D366, 14px)
  {
    id: 'bot-1',
    name: 'Погода Бот',
    username: 'weather_bot',
    isGroup: false,
    isBot: true,
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    keyboard: [
      [{ label: '/start', action: 'start' }, { label: '/help', action: 'help' }],
      [{ label: '/weather', action: 'weather' }],
    ],
    lastMessage: {
      id: 'last-bot-1',
      chatId: 'bot-1',
      senderId: 'bot-1',
      type: 'text',
      content: 'Пожалуйста! Если нужна погода в другом городе — напиши название.',
      timestamp: new Date(Date.now() - 1000 * 60 * 28),
      status: 'read',
      isOutgoing: false,
    },
  },
  {
    id: 'bot-2',
    name: 'Помощник',
    username: 'helper_bot',
    isGroup: false,
    isBot: true,
    unreadCount: 1,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    keyboard: [
      [{ label: 'Настройки', action: 'settings' }, { label: 'Помощь', action: 'help' }],
      [{ label: 'Частые вопросы', action: 'faq' }],
    ],
    lastMessage: {
      id: 'last-bot-2',
      chatId: 'bot-2',
      senderId: 'bot-2',
      type: 'text',
      content: 'Зажмите название чата в списке → «Отключить уведомления» или свайпните чат влево и нажмите «Звук выкл».',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 19.98),
      status: 'read',
      isOutgoing: false,
    },
  },
  // Каналы
  {
    id: 'channel-1',
    name: 'Технологии',
    username: 'tech_channel',
    isGroup: false,
    isChannel: true,
    subscribersCount: 12500,
    unreadCount: 2,
    isPinned: true,
    isMuted: false,
    isArchived: false,
    lastMessage: {
      id: 'last-ch-1',
      chatId: 'channel-1',
      senderId: 'channel-1',
      type: 'text',
      content: 'Релиз React 19: улучшенный компайлер, Actions, use() и многое другое. Подробности в блоге.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: 'read',
      isOutgoing: false,
    },
  },
  {
    id: 'channel-2',
    name: 'Новости дня',
    username: 'news_channel',
    isGroup: false,
    isChannel: true,
    subscribersCount: 8400,
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    lastMessage: {
      id: 'last-ch-2',
      chatId: 'channel-2',
      senderId: 'channel-2',
      type: 'text',
      content: 'Главное за сегодня: курс рубля, погода в регионах, события в мире IT.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1),
      status: 'read',
      isOutgoing: false,
    },
  },
];

// Calls history
export const calls: Call[] = [
  {
    id: 'call-1',
    contactId: 'contact-1',
    contact: contacts[0],
    type: 'video',
    status: 'outgoing',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    duration: 1800,
  },
  {
    id: 'call-2',
    contactId: 'contact-2',
    contact: contacts[1],
    type: 'audio',
    status: 'missed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
  },
  {
    id: 'call-3',
    contactId: 'contact-3',
    contact: contacts[2],
    type: 'audio',
    status: 'incoming',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    duration: 300,
  },
  {
    id: 'call-4',
    contactId: 'contact-6',
    contact: contacts[5],
    type: 'video',
    status: 'outgoing',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    duration: 3600,
  },
  {
    id: 'call-5',
    contactId: 'contact-4',
    contact: contacts[3],
    type: 'audio',
    status: 'declined',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
];

// Messages store (by chat ID)
export const messagesByChat: Record<string, Message[]> = {
  'chat-1': generateMessages('chat-1', 'contact-1'),
  'chat-2': generateMessages('chat-2', 'contact-2'),
  'chat-3': generateMessages('chat-3', 'contact-2'),
  'chat-4': generateMessages('chat-4', 'contact-3'),
  'chat-5': generateMessages('chat-5', 'contact-4'),
  'chat-6': generateMessages('chat-6', 'contact-1'),
  'chat-7': generateMessages('chat-7', 'contact-5'),
  'chat-8': generateMessages('chat-8', 'contact-6'),
  'bot-1': generateBotMessages('bot-1', 'bot-1'),
  'bot-2': generateHelperBotMessages('bot-2', 'bot-2'),
  'channel-1': generateChannelMessages('channel-1', 'Технологии'),
  'channel-2': generateNewsChannelMessages('channel-2'),
};

// Helper functions
export const getContactById = (id: string): Contact | undefined => {
  return contacts.find(c => c.id === id);
};

export const getChatById = (id: string): Chat | undefined => {
  return chats.find(c => c.id === id);
};

export const getMessagesForChat = (chatId: string): Message[] => {
  return messagesByChat[chatId] || [];
};

export const formatLastSeen = (date: Date): string => {
  const now = Date.now();
  const diff = now - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `был(а) ${minutes} мин. назад`;
  if (hours < 24) return `был(а) ${hours} ч. назад`;
  if (days === 1) return 'был(а) вчера';
  return `был(а) ${days} дн. назад`;
};

export const formatMessageTime = (date: Date): string => {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

/** Формат просмотров как в Telegram: 1.2K, 10K */
export const formatViews = (views: number): string => {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(views);
};

export const formatCallDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export { getAvatarColor };
