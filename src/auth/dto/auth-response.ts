import { Field, ObjectType } from '@nestjs/graphql';
import { UserProfileDto } from './user-profile.dto';

@ObjectType()
export class AuthResponse {
  @Field()
  access_token: string;

  @Field(() => UserProfileDto, { nullable: true })
  user?: UserProfileDto;
}
