import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class CallInitiateDto {
  @IsString()
  @IsNotEmpty({ message: 'chatId обязателен' })
  chatId: string;

  @IsObject()
  @IsNotEmpty({ message: 'offer обязателен' })
  offer: any; // RTCSessionDescriptionInit
}
