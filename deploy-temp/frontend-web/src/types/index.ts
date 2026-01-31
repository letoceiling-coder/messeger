export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
  lastSeenAt?: string | null;
}

export interface ChatMemberUser {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
  lastSeenAt?: string | null;
}

export interface ChatMember {
  id: string;
  userId: string;
  user: ChatMemberUser;
}

export interface Chat {
  id: string;
  type: string;
  name?: string | null;
  pinnedMessageId?: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string | null;
  /** Количество непрочитанных сообщений в чате (для текущего пользователя) */
  unreadCount?: number;
  members?: ChatMember[];
  pinnedMessage?: Message | null;
}

/** Статус доставки: отправлено / доставлено / просмотрено */
export type MessageDeliveryStatus = 'sent' | 'delivered' | 'read';

export interface MessageReaction {
  emoji: string;
  count: number;
  users: {
    id: string;
    username: string;
    avatarUrl?: string;
  }[];
}

export interface Message {
  id: string;
  chatId: string;
  userId: string;
  content?: string;
  messageType?: string;
  audioUrl?: string;
  mediaUrl?: string | null;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  isEncrypted?: boolean;
  encryptedContent?: string;
  encryptedKey?: string;
  iv?: string;
  createdAt: string;
  updatedAt: string;
  /** Для своих сообщений: статус доставки получателю */
  deliveryStatus?: MessageDeliveryStatus;
  /** С бэкенда при загрузке (messageDeliveries) */
  messageDeliveries?: { status: string; deliveredAt?: string; readAt?: string }[];
  /** Ответ на сообщение */
  replyToId?: string | null;
  replyTo?: { id: string; content?: string; messageType?: string; userId: string } | null;
  /** Реакции на сообщение */
  reactions?: MessageReaction[];
  /** Редактировано */
  isEdited?: boolean;
  /** Пользователь */
  user?: {
    id: string;
    username: string;
    email?: string;
    avatarUrl?: string;
  };
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
}
