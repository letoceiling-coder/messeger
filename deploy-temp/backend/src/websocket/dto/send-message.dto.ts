import { IsString, IsNotEmpty, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'chatId обязателен' })
  chatId: string;

  @IsString()
  @IsOptional()
  @MaxLength(50000, { message: 'Сообщение не должно превышать 50000 символов' })
  content?: string;

  @IsString()
  @IsOptional()
  audioUrl?: string;

  @IsString()
  @IsOptional()
  messageType?: string;

  @IsBoolean()
  @IsOptional()
  isEncrypted?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(50000)
  encryptedContent?: string;

  @IsString()
  @IsOptional()
  encryptedKey?: string;

  @IsString()
  @IsOptional()
  iv?: string;

  @IsString()
  @IsOptional()
  replyToId?: string;
}
