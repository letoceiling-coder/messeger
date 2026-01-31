import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateGroupChatDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Название группы не должно превышать 100 символов' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Описание не должно превышать 500 символов' })
  description?: string;
}
