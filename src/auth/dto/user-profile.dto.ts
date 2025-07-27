import { ObjectType, OmitType } from '@nestjs/graphql';
import { User } from '../../user/user.model';

@ObjectType()
export class UserProfileDto extends OmitType(User, ['teams'] as const) {
  static fromUser(user: Pick<User, 'id' | 'email' | 'role'>): UserProfileDto {
    const profile = new UserProfileDto();
    profile.id = user.id;
    profile.email = user.email;
    profile.role = user.role;
    return profile;
  }

  static fromJwtPayload(payload: {
    id: number;
    email: string;
    role: any;
  }): UserProfileDto {
    const profile = new UserProfileDto();
    profile.id = payload.id;
    profile.email = payload.email;
    profile.role = payload.role;
    return profile;
  }
}
