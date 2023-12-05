import { Field, Int, ObjectType } from '@nestjs/graphql';
import { UserRole } from './user-role.enum';
// import { User as UserClient } from '@prisma/client';
// import { UserRole } from '@prisma/client';
import { Team } from '../team/team.model';

@ObjectType()
export class User {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  email: string;

  @Field(() => UserRole)
  role: UserRole;

  // Add teams field
  @Field(() => [Team])
  teams?: Team[];
}
