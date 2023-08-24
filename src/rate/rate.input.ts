import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class RateInputCreate {
  @Field(() => String, {
    nullable: false,
    description: 'Rate name',
  })
  name: string;

  @Field(() => Int, {
    nullable: false,
    description: 'Rate',
  })
  rate: number;

  @Field(() => String, {
    nullable: false,
    description: 'Rates team id',
  })
  teamId: string;
}
