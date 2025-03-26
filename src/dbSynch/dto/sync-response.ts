import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SyncResponse {
  @Field()
  status: string;

  @Field()
  message: string;

  @Field()
  timestamp: string;
}
