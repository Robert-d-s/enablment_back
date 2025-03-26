import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../../user/user-role.enum';

@Exclude()
export class UserProfileDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  role: UserRole;

  constructor(partial: Partial<UserProfileDto>) {
    Object.assign(this, partial);
  }
}
