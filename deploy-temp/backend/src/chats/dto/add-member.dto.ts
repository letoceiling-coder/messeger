import { IsString, IsNotEmpty } from 'class-validator';

export class AddMemberDto {
  @IsString()
  @IsNotEmpty({ message: 'ID пользователя обязателен' })
  userId: string;
}
