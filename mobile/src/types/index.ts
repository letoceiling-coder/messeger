/**
 * Общие типы для мобильного приложения
 * (портировано из веб-версии)
 */

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  isOnline?: boolean;
  lastSeenAt?: string;
  createdAt: string;
}

export interface ChatMember {
  id: string;
  chatId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
  leftAt?: string | null;
  user?: User;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  name?: string | null;
  pinnedMessageId?: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string | null;
  unreadCount?: number;
  members?: ChatMember[];
  pinnedMessage?: Message | null;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: {
    id: string;
    username: string;
    avatarUrl?: string;
  }[];
}

export type MessageDeliveryStatus = 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  chatId: string;
  userId: string;
  content?: string;
  messageType?: 'text' | 'voice' | 'image' | 'video' | 'document';
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
  deliveryStatus?: MessageDeliveryStatus;
  messageDeliveries?: {status: string; deliveredAt?: string; readAt?: string}[];
  replyToId?: string | null;
  replyTo?: {id: string; content?: string; messageType?: string; userId: string} | null;
  reactions?: MessageReaction[];
  isEdited?: boolean;
  user?: User;
}

export interface AuthResponse {
  user: User;
  access_token?: string;  // snake_case (legacy)
  accessToken?: string;   // camelCase (backend)
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface NotificationData {
  type: 'message' | 'call' | 'system';
  chatId?: string;
  messageId?: string;
  userId?: string;
  title: string;
  body: string;
  data?: any;
}

export type Theme = 'light' | 'dark' | 'system';
