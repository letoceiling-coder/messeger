import { IsString, Matches, MinLength } from 'class-validator';

export class SendCodeDto {
  @IsString()
  @Matches(/^\+?[78]?[\d\s\-()]{10,}$/, {
    message: 'Введите корректный номер телефона',
  })
  phone: string;
}
