import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Project as ProjectClient } from '@prisma/client';

@ObjectType()
export class Project implements ProjectClient {
  @Field(() => String)
  id: string;

  @Field(() => Int)
  estimatedTime: number;

  @Field(() => String)
  name: string;

  @Field(() => String)
  teamId: string;
  // ---------------------------------
  @Field(() => String)
  createdAt: string;

  @Field(() => String)
  updatedAt: string;

  @Field(() => String)
  description: string;

  @Field(() => String)
  state: string;

  @Field(() => String)
  startDate: string;

  @Field(() => String)
  targetDate: string;

  // ---------------------------------
}
