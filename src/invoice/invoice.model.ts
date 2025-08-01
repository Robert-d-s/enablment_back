import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class Invoice {
  @Field(() => String)
  projectId: string;

  @Field(() => String)
  projectName: string;

  @Field(() => String)
  teamId: string;

  @Field(() => String)
  teamName: string;

  @Field(() => Float)
  totalHours: number;

  @Field(() => Float, {
    description: 'Total cost in Danish Krona (DKK)',
  })
  totalCost: number;

  @Field(() => [RateDetail], { nullable: true })
  rates?: RateDetail[];

  __typename?: string;
}

@ObjectType()
export class RateDetail {
  @Field(() => Int)
  rateId: number;

  @Field(() => String)
  rateName: string;

  @Field(() => Float)
  hours: number;

  @Field(() => Float, {
    description: 'Cost in Danish Krona (DKK) for this rate',
  })
  cost: number;

  @Field(() => Float, {
    description:
      'Rate per hour in Danish Krona (DKK) - converted from øre stored in database',
  })
  ratePerHour: number;

  __typename?: string;
}
