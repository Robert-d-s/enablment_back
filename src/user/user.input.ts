import { Field, InputType } from '@nestjs/graphql';
import { UserRole } from './user-role.enum';

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
