import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../../user/user-role.enum';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Exclude()
export class UserProfileDto {
  @Field()
  @Expose()
  id: number;

  @Field()
  @Expose()
  email: string;

  @Field()
  @Expose()
  role: UserRole;

  constructor(partial: Partial<UserProfileDto>) {
    Object.assign(this, partial);
  }
}
