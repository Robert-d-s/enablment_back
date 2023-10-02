import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MemberDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;
}

@ObjectType()
export class TeamDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  createdAt: string;

  @Field(() => String)
  timezone: string;

  @Field(() => [MemberDTO])
  members: MemberDTO[];
}

@ObjectType()
export class TeamsDTO {
  @Field(() => [TeamDTO])
  nodes: TeamDTO[];
}

@ObjectType()
export class LinearDataDTO {
  @Field(() => TeamsDTO)
  teams: TeamsDTO;
}
