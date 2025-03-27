// src/time/time.input.ts
import { Field, InputType, Int } from '@nestjs/graphql'; // Use Int for GraphQL
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'; // <--- Import these
import { Type } from 'class-transformer'; // <--- Import this

@InputType()
export class TimeInputCreate {
  @Field(() => Date, {
    // For GraphQL
    nullable: false,
    description: 'Start time',
  })
  @IsDate() // For ValidationPipe
  @IsNotEmpty() // For ValidationPipe
  @Type(() => Date) // For ValidationPipe (transform)
  startTime: Date;

  @Field(() => Date, {
    // For GraphQL
    nullable: true,
    description: 'End time',
  })
  @IsOptional() // For ValidationPipe
  @IsDate() // For ValidationPipe
  @Type(() => Date) // For ValidationPipe (transform)
  endTime?: Date;

  @Field(() => String, {
    // For GraphQL
    nullable: false,
    description: 'Project ID',
  })
  @IsString() // For ValidationPipe
  @IsNotEmpty() // For ValidationPipe
  projectId: string;

  @Field(() => Int, {
    // For GraphQL (Use Int)
    nullable: false,
    description: 'User ID',
  })
  @IsNumber() // For ValidationPipe
  @IsNotEmpty() // For ValidationPipe
  userId: number;

  @Field(() => Int, {
    // For GraphQL (Use Int)
    nullable: false,
    description: 'Rate ID',
  })
  @IsNumber() // For ValidationPipe
  @IsNotEmpty() // For ValidationPipe
  rateId: number;

  @Field(() => Int, {
    // For GraphQL (Use Int)
    nullable: false,
    description: 'Total Elapsed Time',
  })
  @IsNumber() // For ValidationPipe
  @IsNotEmpty() // For ValidationPipe
  totalElapsedTime: number;
}

// Add relevant validators to TimeInputUpdate as well
@InputType()
export class TimeInputUpdate {
  @Field(() => Int, {
    // Use Int
    nullable: false,
    description: 'Time entry ID',
  })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @Field(() => Date, {
    nullable: true,
    description: 'End time',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endTime?: Date;

  @Field(() => Int, {
    // Use Int
    nullable: false,
    description: 'Total Elapsed Time',
  })
  @IsNumber()
  @IsNotEmpty()
  totalElapsedTime: number;
}
