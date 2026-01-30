import { IsString, IsNotEmpty, IsObject } from 'class-validator';

import { IsBoolean, IsOptional } from 'class-validator';

export class CallInitiateDto {
  @IsString()
  @IsNotEmpty({ message: 'chatId обязателен' })
  chatId: string;

  @IsObject()
  @IsNotEmpty({ message: 'offer обязателен' })
  offer: any; // RTCSessionDescriptionInit

  @IsBoolean()
  @IsOptional()
  videoMode?: boolean; // true для видеозвонка, false для голосового
}
