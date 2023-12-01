import { Args, Mutation, Query, Resolver, Int } from '@nestjs/graphql';
import { User } from './user.model';
import { UserService } from './user.service';
// import { UserRole } from '@prisma/client';
import { UserRole } from './user-role.enum';

@Resolver(() => User)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => [User])
  async users(): Promise<User[]> {
    return this.userService.all();
  }

  @Mutation(() => User)
  async updateUserRole(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('newRole', { type: () => UserRole }) newRole: UserRole,
  ): Promise<User> {
    return this.userService.updateUserRole(userId, newRole);
  }
}
