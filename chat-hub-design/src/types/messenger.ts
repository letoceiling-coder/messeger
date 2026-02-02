export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export type MessageType =
  | 'text'
  | 'voice'
  | 'video_note'
  | 'image'
  | 'video'
  | 'gif'
  | 'sticker'
  | 'file'
  | 'poll'
  | 'location'
  | 'contact'
  | 'system';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  status: MessageStatus;
  isOutgoing: boolean;
  // Voice message: duration, waveform 30–60 bars, played
  duration?: number;
  waveform?: number[];
  isPlayed?: boolean;
  // Video note: duration, played
  videoNoteDuration?: number;
  // Media
  mediaUrl?: string;
  thumbnailUrl?: string;
  fileName?: string;
  fileSize?: number;
  // Contact (for type 'contact')
  contactName?: string;
  contactPhone?: string;
  contactAvatar?: string;
  // Sticker (for type 'sticker')
  stickerId?: string;
  stickerPackId?: string;
  isAnimated?: boolean;
  // Reply / Edit
  replyTo?: string;
  editedAt?: Date;
  // Forward
  isForwarded?: boolean;
  forwardSenderName?: string;
  // Канал: просмотры и реакции (как в Telegram)
  views?: number;
  reactions?: MessageReaction[];
  // Бот: кнопки под сообщением (inline, reply, url)
  buttons?: BotButton[];
  /** Бот: «обрабатывается...» — показывать статус выполнения запроса */
  isProcessing?: boolean;
}

/** Кнопка бота: inline (в сообщении), reply (ответ выбором), url (переход по ссылке) */
export interface BotButton {
  id?: string;
  type: 'inline' | 'reply' | 'url';
  label: string;
  /** callback_data для inline, текст ответа для reply */
  action?: string;
  /** URL для type === 'url' */
  url?: string;
}

/** Строка кнопок клавиатуры бота (Custom Keyboard) */
export type BotKeyboardRow = { label: string; action?: string }[];

export interface MessageReaction {
  emoji: string;
  count: number;
  /** id пользователей, поставивших эту реакцию (для подсветки «вы») */
  userIds?: string[];
}

export type StickerStateType =
  | 'idle'
  | 'panel_open'
  | 'browsing'
  | 'searching'
  | 'sending'
  | 'receiving'
  | 'playing';

export interface Sticker {
  id: string;
  packId: string;
  url: string;
  animatedUrl?: string;
  emoji?: string;
  keywords?: string[];
}

export interface StickerPack {
  id: string;
  title: string;
  iconUrl: string;
  stickers: Sticker[];
}

export interface Chat {
  id: string;
  name: string;
  avatar?: string;
  /** @username для ботов и каналов (например @durov) */
  username?: string;
  isGroup: boolean;
  /** Чат с ботом */
  isBot?: boolean;
  /** Канал (только посты от канала, без ответов пользователя в ленте) */
  isChannel?: boolean;
  /** Канал: количество подписчиков (для отображения в header) */
  subscribersCount?: number;
  /** Клавиатура бота (ряды кнопок под полем ввода). Фон кнопок #25D366, 14px */
  keyboard?: BotKeyboardRow[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  members?: string[];
  isOnline?: boolean;
  lastSeen?: Date;
  isTyping?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  isOnline: boolean;
  lastSeen?: Date;
  isTyping?: boolean;
  /** Spec 11.4: pinned — always on top */
  isPinned?: boolean;
  /** Spec 11.7–11.8: archived — hidden from main list */
  isArchived?: boolean;
  /** Spec 11.9: mute notifications per contact */
  isMuted?: boolean;
  /** Spec 11.11: blocked — cannot write, hidden from list */
  isBlocked?: boolean;
}

export type CallType = 'audio' | 'video';
export type CallStatus = 'incoming' | 'outgoing' | 'missed' | 'declined';

export interface Call {
  id: string;
  contactId: string;
  contact: Contact;
  type: CallType;
  status: CallStatus;
  timestamp: Date;
  duration?: number;
}

/** Active call session — spec 10.x */
export type CallSessionState = 'calling' | 'ringing' | 'connected' | 'reconnecting' | 'ended';
export type CallNetworkState = 'good' | 'poor' | 'reconnecting' | 'lost';

export interface CallSession {
  id: string;
  direction: 'incoming' | 'outgoing';
  type: CallType;
  contact: Contact;
  state: CallSessionState;
  networkState: CallNetworkState;
  startTime: number | null; // timestamp when connected, for timer
  muted: boolean;
  speaker: boolean;
  cameraOff: boolean; // video only
  frontCamera: boolean; // video only
}

export interface User {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  phone: string;
  /** Эл. почта */
  email?: string;
  /** Дата рождения (YYYY-MM-DD) */
  dateOfBirth?: string;
  /** О себе */
  bio?: string;
  /** Видео профиля (до 5 сек) — URL */
  profileVideoUrl?: string;
  isOnline: boolean;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  sounds: boolean;
  vibration: boolean;
  lastSeenPrivacy: 'everyone' | 'contacts' | 'nobody';
  profilePhotoPrivacy: 'everyone' | 'contacts' | 'nobody';
  fontSize: 'small' | 'medium' | 'large';
}
