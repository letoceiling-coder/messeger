import { IsString, Matches, IsEmail, ValidateIf } from 'class-validator';

export class SendCodeDto {
  @ValidateIf((o) => !o.email)
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{10,20}$/, {
    message: 'Введите корректный номер телефона',
  })
  phone?: string;

  @ValidateIf((o) => !o.phone)
  @IsEmail({}, { message: 'Введите корректный email' })
  email?: string;
}
