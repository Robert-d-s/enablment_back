import { Field, Int, ObjectType } from '@nestjs/graphql';
import { User as UserClient } from '@prisma/client';

@ObjectType()
export class User implements UserClient {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  email: string;

  @Field(() => String)
  password: string;
}
