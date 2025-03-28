import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../../user/user-role.enum';
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

  constructor(partial: UserProfileDto) {
    Object.assign(this, partial);
  }
}
