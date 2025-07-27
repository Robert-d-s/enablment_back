import { Field, ObjectType } from '@nestjs/graphql';
import { UserProfileDto } from './user-profile.dto';

@ObjectType()
export class AuthResponse {
  @Field(() => String)
  accessToken: string; // Changed from access_token to camelCase

  @Field(() => UserProfileDto, { nullable: true })
  user?: UserProfileDto;
}
