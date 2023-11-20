import { Field, ObjectType } from '@nestjs/graphql';
import { Issue as IssueClient } from '@prisma/client';

@ObjectType()
export class Issue implements IssueClient {
  @Field(() => String)
  id: string;

  @Field(() => String)
  createdAt: string;

  @Field(() => String)
  updatedAt: string;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  dueDate: string;

  @Field(() => String)
  projectId: string;

  @Field(() => String)
  priorityLabel: string;

  @Field(() => String)
  identifier: string;

  @Field(() => String)
  assigneeName: string;

  @Field(() => String)
  projectName: string;

  @Field(() => String)
  state: string;

  @Field(() => String)
  teamKey: string;

  @Field(() => String)
  teamName: string;

  @Field(() => [Label], { nullable: 'itemsAndList' })
  labels: Label[];
}

@ObjectType()
export class Label {
  @Field(() => String)
  id: string;

  @Field(() => String)
  color: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  parentId: string;
}
