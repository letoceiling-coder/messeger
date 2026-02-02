import { IsString, Matches, IsEmail, Length, ValidateIf } from 'class-validator';

export class VerifyCodeDto {
  @ValidateIf((o) => !o.email)
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{10,20}$/, {
    message: 'Введите корректный номер телефона',
  })
  phone?: string;

  @ValidateIf((o) => !o.phone)
  @IsEmail({}, { message: 'Введите корректный email' })
  email?: string;

  @IsString()
  @Length(4, 6, { message: 'Код должен быть 4–6 цифр' })
  @Matches(/^\d+$/, { message: 'Код должен содержать только цифры' })
  code: string;
}
