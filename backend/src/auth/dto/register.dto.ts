import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email должен быть валидным' })
  email: string;

  @IsString()
  @MinLength(3, { message: 'Username должен быть минимум 3 символа' })
  @MaxLength(50, { message: 'Username не должен превышать 50 символов' })
  @Matches(/^[a-zA-Zа-яА-ЯёЁ0-9_\s]+$/, {
    message: 'Username может содержать только буквы (латиница, кириллица), цифры, подчеркивание и пробелы',
  })
  username: string;

  @IsString()
  @MinLength(6, { message: 'Пароль должен быть минимум 6 символов' })
  @MaxLength(100, { message: 'Пароль не должен превышать 100 символов' })
  password: string;
}
