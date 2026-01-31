import { IsString, IsIn } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsString()
  @IsIn(['admin', 'member'], { message: 'Роль может быть только admin или member' })
  role: 'admin' | 'member';
}
