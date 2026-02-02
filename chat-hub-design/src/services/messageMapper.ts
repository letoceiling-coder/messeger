import type { Message } from '@/types/messenger';

/** Ответ API GET /messages — один элемент массива */
export interface ApiMessage {
  id: string;
  chatId: string;
  userId: string;
  content: string;
  messageType: string;
  audioUrl?: string | null;
  mediaUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  replyToId?: string | null;
  isEdited?: boolean;
  createdAt: string;
  user?: { id: string; username?: string };
  messageDeliveries?: Array<{ status: string; readAt?: string | null }>;
}

export function mapApiMessageToMessage(api: ApiMessage, currentUserId: string): Message {
  const ts = typeof api.createdAt === 'string' ? new Date(api.createdAt) : api.createdAt;
  const isOutgoing = api.userId === currentUserId;
  const delivery = api.messageDeliveries?.[0];
  const status = (delivery?.status as Message['status']) || 'sent';

  return {
    id: api.id,
    chatId: api.chatId,
    senderId: api.userId,
    type: (api.messageType as Message['type']) || 'text',
    content: api.content ?? '',
    timestamp: ts,
    status,
    isOutgoing,
    replyTo: api.replyToId ?? undefined,
    editedAt: api.isEdited ? ts : undefined,
    mediaUrl: api.mediaUrl ?? undefined,
    fileName: api.fileName ?? undefined,
    fileSize: api.fileSize ?? undefined,
  };
}
