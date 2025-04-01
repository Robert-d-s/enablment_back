import { Field, Int, ObjectType } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { Team } from '../team/team.model';

@ObjectType()
export class User {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  email: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field(() => [Team])
  teams?: Team[];
}
