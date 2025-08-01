import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Rate as RateClient } from '@prisma/client';

@ObjectType()
export class Rate implements RateClient {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String)
  teamId: string;

  @Field(() => Int, {
    description: 'Hourly rate in øre (e.g., 5000 = 50.00 DKK/hour)',
  })
  rate: number;
}

@ObjectType()
export class DeleteRateResponse {
  @Field(() => Int)
  id: number;
}
