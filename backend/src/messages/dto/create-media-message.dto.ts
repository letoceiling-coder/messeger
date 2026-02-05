export class CreateMediaMessageDto {
  chatId: string;
  userId: string;
  mediaUrl: string;
  messageType: 'image' | 'video' | 'video_note';
  /** Подпись к медиа (опционально) */
  caption?: string;
}
