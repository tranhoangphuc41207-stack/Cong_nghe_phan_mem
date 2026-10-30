import { IsEnum } from 'class-validator';
import { Role } from '../../common/role.enum';

export class UpdateUserRoleDto {
  @IsEnum(Role) role: Role;
}
