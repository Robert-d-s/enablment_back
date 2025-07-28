import { Field, InputType } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

@InputType()
export class CreateProjectInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  id: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  teamId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  state?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @Field(() => String)
  @IsDateString()
  createdAt: string;

  @Field(() => String)
  @IsDateString()
  updatedAt: string;
}

@InputType()
export class UpdateProjectInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  id: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  teamId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  state?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @Field(() => String)
  @IsDateString()
  updatedAt: string;
}

export interface ProjectSyncData {
  id: string;
  name: string;
  teamId: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  state?: string;
  startDate?: string;
  targetDate?: string;
}
