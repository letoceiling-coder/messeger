import { IsString, IsNotEmpty, IsArray, ArrayMinSize, MaxLength, IsOptional } from 'class-validator';

export class CreateGroupChatDto {
  @IsString()
  @IsNotEmpty({ message: 'Название группы обязательно' })
  @MaxLength(100, { message: 'Название группы не должно превышать 100 символов' })
  name: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Добавьте хотя бы одного участника' })
  @IsString({ each: true })
  memberIds: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Описание не должно превышать 500 символов' })
  description?: string;
}
