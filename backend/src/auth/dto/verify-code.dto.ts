import { IsString, Matches, Length } from 'class-validator';

export class VerifyCodeDto {
  @IsString()
  @Matches(/^\+?[78]?[\d\s\-()]{10,}$/, {
    message: 'Введите корректный номер телефона',
  })
  phone: string;

  @IsString()
  @Length(4, 6, { message: 'Код должен быть 4–6 цифр' })
  @Matches(/^\d+$/, { message: 'Код должен содержать только цифры' })
  code: string;
}
