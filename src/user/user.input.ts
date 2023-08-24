import { Field, InputType } from '@nestjs/graphql';

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
}
