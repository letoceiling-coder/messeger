import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class CallIceCandidateDto {
  @IsString()
  @IsNotEmpty({ message: 'chatId обязателен' })
  chatId: string;

  @IsObject()
  @IsNotEmpty({ message: 'candidate обязателен' })
  candidate: any; // RTCIceCandidateInit
}
