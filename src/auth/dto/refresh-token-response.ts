// src/auth/dto/refresh-token-response.ts
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RefreshTokenResponse {
  @Field(() => String) // Specify String type for GraphQL
  access_token: string;
}
