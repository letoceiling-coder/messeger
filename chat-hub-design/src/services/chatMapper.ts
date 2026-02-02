import type { Chat, Message } from '@/types/messenger';

/** Ответ API GET /chats — один элемент массива */
export interface ApiChat {
  id: string;
  type: string;
  name: string | null;
  lastMessageAt: string | null;
  pinnedMessageId: string | null;
  members: Array<{
    userId: string;
    user: {
      id: string;
      username: string;
      email: string | null;
      avatarUrl: string | null;
      isOnline: boolean;
      lastSeenAt: string | null;
    };
  }>;
  lastMessage?: {
    id: string;
    chatId: string;
    senderId: string;
    type: string;
    content: string;
    timestamp: string;
    isOutgoing: boolean;
    replyToId?: string | null;
    isEdited?: boolean;
    audioUrl?: string | null;
    mediaUrl?: string | null;
    fileName?: string | null;
    fileSize?: number | null;
  } | null;
  unreadCount: number;
}

function mapLastMessage(api: ApiChat['lastMessage'], currentUserId: string): Message | undefined {
  if (!api) return undefined;
  const ts = typeof api.timestamp === 'string' ? new Date(api.timestamp) : api.timestamp;
  return {
    id: api.id,
    chatId: api.chatId,
    senderId: api.senderId,
    type: (api.type as Message['type']) || 'text',
    content: api.content ?? '',
    timestamp: ts,
    status: 'sent',
    isOutgoing: api.isOutgoing ?? api.senderId === currentUserId,
    replyTo: api.replyToId ?? undefined,
    editedAt: api.isEdited ? ts : undefined,
    mediaUrl: api.mediaUrl ?? undefined,
    fileName: api.fileName ?? undefined,
    fileSize: api.fileSize ?? undefined,
  };
}

export function mapApiChatToChat(api: ApiChat, currentUserId: string): Chat {
  const isGroup = api.type === 'group';
  const otherMember = !isGroup
    ? api.members.find((m) => m.userId !== currentUserId)
    : null;
  const displayName =
    api.name ||
    (otherMember
      ? otherMember.user.username || otherMember.user.email || 'Пользователь'
      : 'Чат');
  const avatar = otherMember?.user.avatarUrl ?? undefined;
  const isOnline = otherMember?.user.isOnline ?? false;
  const lastSeen = otherMember?.user.lastSeenAt
    ? new Date(otherMember.user.lastSeenAt)
    : undefined;
  const memberIds = api.members.map((m) => m.userId);
  const lastMessage = mapLastMessage(api.lastMessage ?? undefined, currentUserId);

  return {
    id: api.id,
    name: displayName,
    avatar,
    isGroup,
    unreadCount: api.unreadCount ?? 0,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    members: isGroup ? memberIds : undefined,
    isOnline,
    lastSeen,
    lastMessage,
  };
}
