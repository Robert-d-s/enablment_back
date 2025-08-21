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
  @Field(() => [Project], { nullable: true })
  projects?: Project[];

  @Field(() => [Rate])
  @Field(() => [Rate], { nullable: true })
  rates?: Rate[];
}

@ObjectType()
export class SimpleTeamDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;
}
