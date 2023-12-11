import { Args, Mutation, Query, Resolver, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { User } from './user.model';
import { UserService } from './user.service';
// import { UserRole } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { UserRole } from './user-role.enum';

@Resolver(() => User)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => [User])
  @Roles(UserRole.ADMIN, UserRole.ENABLER)
  @UseGuards(AuthGuard)
  async users(): Promise<User[]> {
    const users = await this.userService.all();
    console.log('Fetched users:', JSON.stringify(users, null, 2));
    return users.map((user) => ({
      ...user,
      role: UserRole[user.role as keyof typeof UserRole],
    }));
  }

  @Mutation(() => User)
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  async updateUserRole(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('newRole', { type: () => UserRole }) newRole: UserRole,
  ): Promise<User> {
    const updatedUser = await this.userService.updateUserRole(userId, newRole);
    console.log(
      'User after role update:',
      JSON.stringify(updatedUser, null, 2),
    );
    return {
      ...updatedUser,
      role: UserRole[updatedUser.role as keyof typeof UserRole],
    };
  }

  @Mutation(() => User)
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  async addUserToTeam(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('teamId') teamId: string,
  ): Promise<User> {
    const user = await this.userService.addUserToTeam(userId, teamId);
    console.log('User add:', JSON.stringify(user, null, 2));
    return {
      ...user,
      role: UserRole[user.role as keyof typeof UserRole],
    };
  }

  @Mutation(() => User)
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  async removeUserFromTeam(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('teamId') teamId: string,
  ): Promise<User> {
    try {
      const user = await this.userService.removeUserFromTeam(userId, teamId);
      console.log('User removed from team:', JSON.stringify(user, null, 2));
      return {
        ...user,
        role: UserRole[user.role as keyof typeof UserRole],
      };
    } catch (error) {
      console.error('Error occurred while removing user from team:', error);
      throw new Error('Error removing user from team');
    }
  }
}
