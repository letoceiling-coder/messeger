import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateDocumentMessageDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @IsNotEmpty()
  documentUrl: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsNumber()
  @IsNotEmpty()
  fileSize: number;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsString()
  @IsOptional()
  content?: string; // Опциональный текст к документу
}
