import {
  Args,
  Mutation,
  Query,
  Resolver,
  Int,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { User } from './user.model';
import { UserService } from './user.service';
import { Roles } from '../auth/roles.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { UserRole } from './user-role.enum';
import { TeamLoader } from '../loaders/team.loader';
import { Team } from '../team/team.model';
import { PrismaService } from '../prisma/prisma.service';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private userService: UserService,
    private teamLoader: TeamLoader,
    private prisma: PrismaService,
  ) {}

  @Query(() => [User])
  @Roles(UserRole.ADMIN, UserRole.ENABLER)
  @UseGuards(AuthGuard)
  async users(): Promise<User[]> {
    // Only fetch the basic user data without nested relationships
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    return users.map((user) => ({
      ...user,
      role: UserRole[user.role as keyof typeof UserRole],
    }));
  }

  @ResolveField(() => [Team])
  async teams(@Parent() user: User): Promise<Team[]> {
    // This will be called only when teams field is requested
    // Uses DataLoader to batch and cache the requests
    const teams = await this.teamLoader.byUserId.load(user.id);

    // Map to proper Team model objects with empty projects and rates
    // These will be populated by their own field resolvers if needed
    return teams.map((team) => ({
      ...team,
      projects: [],
      rates: [],
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
