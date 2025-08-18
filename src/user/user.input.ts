import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { UserRole } from '@prisma/client';

@InputType()
export class UserInputCreate {
  @Field(() => String, {
    nullable: false,
    description: "User's email",
  })
  email: string;

  @Field(() => String, {
    nullable: false,
    description: "User's password",
  })
  password: string;

  @Field(() => UserRole, {
    nullable: true,
    description: "User's role",
  })
  role?: UserRole;
}

@InputType()
export class UpdateUserRoleInput {
  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  userId: number;

  @Field(() => UserRole)
  @IsEnum(UserRole)
  @IsNotEmpty()
  newRole: UserRole;
}

@InputType()
export class UserTeamInput {
  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  userId: number;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  teamId: string;
}
