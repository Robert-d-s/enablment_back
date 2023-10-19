import { Field, ObjectType } from '@nestjs/graphql';
import { Team as TeamClient } from '@prisma/client';
import { Project } from '../project/project.model';
import { Rate } from '../rate/rate.model';

@ObjectType()
export class Team implements TeamClient {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => [Project])
  projects: Project[];

  @Field(() => [Rate])
  rates: Rate[];
}
