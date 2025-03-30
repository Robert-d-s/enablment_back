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
    description: 'Rate',
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
