import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class Invoice {
  @Field(() => String)
  projectId: string;

  @Field(() => String)
  projectName: string;

  @Field(() => Float)
  totalHours: number;

  @Field(() => Float)
  totalCost: number;

  @Field(() => [RateDetail], { nullable: true })
  rates?: RateDetail[];
}
// Assuming you want to include details about the rates applied
@ObjectType()
export class RateDetail {
  @Field(() => Int)
  rateId: number;

  @Field(() => String)
  rateName: string;

  @Field(() => Float)
  hours: number;

  @Field(() => Float)
  cost: number;

  @Field(() => Float)
  ratePerHour: number;
}
