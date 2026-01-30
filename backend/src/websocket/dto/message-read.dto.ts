import { IsString, IsNotEmpty } from 'class-validator';

export class MessageReadDto {
  @IsString()
  @IsNotEmpty({ message: 'messageId обязателен' })
  messageId: string;
}
