import { IsString, Matches } from 'class-validator';

export class SendCodeDto {
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{10,20}$/, {
    message: 'Введите корректный номер телефона',
  })
  phone: string;
}
