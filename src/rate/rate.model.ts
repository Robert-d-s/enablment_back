import { Field, Int, Float, ObjectType } from '@nestjs/graphql';
import { Rate as RateClient } from '@prisma/client';

@ObjectType()
export class Rate implements Omit<RateClient, 'rate'> {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String)
  teamId: string;

  @Field(() => Float, {
    description:
      'Hourly rate in Danish Krona (DKK) - e.g., 50.00 for 50.00 DKK/hour',
  })
  rate: number;

  // Helper method to convert Prisma Decimal to number
  static fromPrisma(prismaRate: RateClient): Rate {
    return {
      ...prismaRate,
      rate: prismaRate.rate.toNumber(),
    };
  }
}

@ObjectType()
export class DeleteRateResponse {
  @Field(() => Int)
  id: number;
}
