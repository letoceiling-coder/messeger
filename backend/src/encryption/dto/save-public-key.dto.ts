import { IsString, IsNotEmpty } from 'class-validator';

export class SavePublicKeyDto {
  @IsString()
  @IsNotEmpty()
  publicKey: string;
}
