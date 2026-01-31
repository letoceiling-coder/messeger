import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class CallAnswerDto {
  @IsString()
  @IsNotEmpty({ message: 'chatId обязателен' })
  chatId: string;

  @IsObject()
  @IsNotEmpty({ message: 'answer обязателен' })
  answer: any; // RTCSessionDescriptionInit
}
