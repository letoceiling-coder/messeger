import { IsString, IsNotEmpty } from 'class-validator';

export class CreateVoiceMessageDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @IsNotEmpty()
  audioUrl: string;

  @IsString()
  duration?: string; // Длительность в секундах
}
