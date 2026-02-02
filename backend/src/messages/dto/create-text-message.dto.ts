import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateTextMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'chatId обязателен' })
  chatId: string;

  @IsString()
  @MaxLength(50000, { message: 'Сообщение не должно превышать 50000 символов' })
  content: string;

  @IsString()
  @IsOptional()
  replyToId?: string;
}
