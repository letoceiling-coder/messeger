import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email должен быть валидным' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Пароль должен быть минимум 6 символов' })
  password: string;
}
