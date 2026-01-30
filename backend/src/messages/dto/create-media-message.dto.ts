export class CreateMediaMessageDto {
  chatId: string;
  userId: string;
  mediaUrl: string;
  messageType: 'image' | 'video';
  /** Подпись к медиа (опционально) */
  caption?: string;
}
