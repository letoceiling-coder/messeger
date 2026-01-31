import { IsString, IsNotEmpty } from 'class-validator';

export class MessageDeliveredDto {
  @IsString()
  @IsNotEmpty({ message: 'messageId обязателен' })
  messageId: string;
}
