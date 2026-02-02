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

/** Парсит длительность голосового из content "Голосовое сообщение (12с)" */
function parseVoiceDuration(content: string): number | undefined {
  const m = /\((\d+)с\)/.exec(content);
  return m ? parseInt(m[1], 10) : undefined;
}

export function mapApiMessageToMessage(api: ApiMessage, currentUserId: string): Message {
  const ts = typeof api.createdAt === 'string' ? new Date(api.createdAt) : api.createdAt;
  const isOutgoing = api.userId === currentUserId;
  const delivery = api.messageDeliveries?.[0];
  const status = (delivery?.status as Message['status']) || 'sent';
  const type = (api.messageType as Message['type']) || 'text';

  const msg: Message = {
    id: api.id,
    chatId: api.chatId,
    senderId: api.userId,
    type,
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

  if (type === 'voice') {
    msg.mediaUrl = api.audioUrl ?? undefined;
    msg.duration = parseVoiceDuration(api.content ?? '');
  }

  return msg;
}

/** Маппер для сообщения из upload API (создано нами) */
export function mapUploadMessageToMessage(
  api: { id: string; chatId: string; userId: string; content: string; messageType: string; audioUrl?: string | null; mediaUrl?: string | null; fileName?: string | null; fileSize?: number | null; createdAt: string },
  currentUserId: string,
  extra?: Partial<Message>
): Message {
  const base = mapApiMessageToMessage({ ...api, messageDeliveries: [{ status: 'sent' }] }, currentUserId);
  return { ...base, ...extra };
}
