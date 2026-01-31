import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Содержимое сообщения не может быть пустым' })
  @MaxLength(5000, { message: 'Сообщение не должно превышать 5000 символов' })
  content: string;
}
