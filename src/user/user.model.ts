import { Field, Int, ObjectType } from '@nestjs/graphql';
// import { UserRole } from './user-role.enum';
import { User as UserClient } from '@prisma/client';
import { UserRole } from '@prisma/client';

@ObjectType()
export class User implements UserClient {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  email: string;

  @Field(() => String)
  password: string;

  @Field(() => String)
  role: UserRole;
}
