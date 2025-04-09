import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Project as ProjectClient } from '@prisma/client';

@ObjectType()
export class Project implements ProjectClient {
  @Field(() => String)
  id: string;

  @Field(() => Int, { nullable: true })
  estimatedTime: number | null;

  @Field(() => String)
  name: string;

  @Field(() => String)
  teamId: string;

  @Field(() => String, { nullable: true })
  teamName?: string;

  @Field(() => String)
  createdAt: string;

  @Field(() => String)
  updatedAt: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => String)
  state: string;

  @Field(() => String, { nullable: true })
  startDate: string | null;

  @Field(() => String, { nullable: true })
  targetDate: string | null;
}
