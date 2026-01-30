import { IsString, IsNotEmpty } from 'class-validator';

export class JoinChatDto {
  @IsString()
  @IsNotEmpty({ message: 'chatId обязателен' })
  chatId: string;
}
