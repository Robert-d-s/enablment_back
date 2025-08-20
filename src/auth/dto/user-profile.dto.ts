import { ObjectType, OmitType } from '@nestjs/graphql';
import { User } from '../../user/user.model';
import type { JwtPayload, UserProfile } from '../types';

@ObjectType()
export class UserProfileDto extends OmitType(User, ['teams'] as const) {
  static fromUser(user: UserProfile): UserProfileDto {
    const profile = new UserProfileDto();
    profile.id = user.id;
    profile.email = user.email;
    profile.role = user.role;
    return profile;
  }

  static fromJwtPayload(payload: JwtPayload): UserProfileDto {
    const profile = new UserProfileDto();
    profile.id = payload.id;
    profile.email = payload.email;
    profile.role = payload.role;
    return profile;
  }
}
