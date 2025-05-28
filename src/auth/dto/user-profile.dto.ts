import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '@prisma/client';
import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
@Exclude()
export class UserProfileDto {
  @Field(() => Int)
  @Expose()
  id: number;

  @Field()
  @Expose()
  email: string;

  @Field(() => UserRole)
  @Expose()
  role: UserRole;
  constructor(partial?: { id: number; email: string; role: UserRole }) {
    if (partial) {
      this.id = partial.id;
      this.email = partial.email;
      this.role = partial.role;
    }
  }
}
