import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RefreshTokenResponse {
  @Field(() => String)
  accessToken: string; // Changed from access_token to camelCase
}
