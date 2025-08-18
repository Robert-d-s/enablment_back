import { Field, InputType } from '@nestjs/graphql';
import { IsString, Length, Matches, IsNotEmpty } from 'class-validator';

@InputType()
export class CreateTeamInput {
  @Field(() => String, {
    description:
      'Unique team identifier (3-50 characters, alphanumeric, hyphens, underscores)',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 50, {
    message: 'Team ID must be between 3 and 50 characters',
  })
  @Matches(/^[a-zA-Z0-9-_]+$/, {
    message:
      'Team ID can only contain letters, numbers, hyphens, and underscores',
  })
  id: string;

  @Field(() => String, {
    description: 'Team display name (2-100 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100, {
    message: 'Team name must be between 2 and 100 characters',
  })
  name: string;
}

@InputType()
export class GetTeamInput {
  @Field(() => String, {
    description: 'Team ID to retrieve',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  @Matches(/^[a-zA-Z0-9-_]+$/)
  id: string;
}
