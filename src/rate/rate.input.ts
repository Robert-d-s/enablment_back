import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsInt, IsString, Min } from 'class-validator';

@InputType()
export class RateInputCreate {
  @Field(() => String, {
    nullable: false,
    description: 'Rate name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field(() => Int, {
    nullable: false,
    description: 'Hourly rate in øre (e.g., 5000 = 50.00 DKK/hour)',
  })
  @IsInt()
  @IsNotEmpty()
  @Min(0)
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
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  rateId: number;
}
