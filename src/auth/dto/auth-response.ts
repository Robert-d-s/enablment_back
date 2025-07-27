import { Field, ObjectType } from '@nestjs/graphql';
import { UserProfileDto } from './user-profile.dto';

@ObjectType()
export class AuthResponse {
  @Field(() => String)
  accessToken: string;

  @Field(() => UserProfileDto, { nullable: true })
  user?: UserProfileDto;
}
