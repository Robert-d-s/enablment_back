import { Field, InputType, Int, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsString, Min, Max } from 'class-validator';

@InputType()
export class RateInputCreate {
  @Field(() => String, {
    nullable: false,
    description: 'Rate name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field(() => Float, {
    nullable: false,
    description:
      'Hourly rate in Danish Krona (DKK) - e.g., 50.00 for 50.00 DKK/hour',
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  @Max(10000)
  rate: number;

  @Field(() => String, {
    nullable: false,
    description: 'Rates team id',
  })
  @IsString()
  @IsNotEmpty()
  teamId: string;
}

@InputType()
export class DeleteRateInput {
  @Field(() => Int)
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  rateId: number;
}
