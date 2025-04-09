import {
  Args,
  Mutation,
  Query,
  Resolver,
  Int,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { User } from './user.model';
import { UserService } from './user.service';
import { Roles } from '../auth/roles.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { UserRole } from '@prisma/client';
import { TeamLoader } from '../loaders/team.loader';
import { Team } from '../team/team.model';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectLoader } from '../loaders/project.loader';
import { Project } from '../project/project.model';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserProfileDto } from '../auth/dto/user-profile.dto';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private userService: UserService,
    private teamLoader: TeamLoader,
    private projectLoader: ProjectLoader,
    private prisma: PrismaService,
  ) {}

  @Query(() => [Project])
  @UseGuards(AuthGuard)
  async myProjects(
    @CurrentUser() currentUser: UserProfileDto,
  ): Promise<Project[]> {
    if (!currentUser) {
      throw new UnauthorizedException();
    }

    const teams = await this.teamLoader.byUserId.load(currentUser.id);

    if (!teams || teams.length === 0) {
      return [];
    }

    const teamIds = teams.map((team) => team.id);
    const projectsPerTeam = await this.projectLoader.byTeamId.loadMany(teamIds);
    const allProjects = (
      projectsPerTeam.flat() as Array<Project | Error | null>
    ).filter((p): p is Project => p instanceof Error === false && p !== null);
    const teamIdToNameMap = new Map(teams.map((t) => [t.id, t.name]));
    return allProjects.map((p) => ({
      ...p,
      // teamName: teamIdToNameMap.get(p.teamId) || 'Unknown',
    }));
  }

  @Query(() => [User])
  @Roles(UserRole.ADMIN, UserRole.ENABLER)
  @UseGuards(AuthGuard)
  async users(): Promise<User[]> {
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
    const teams = await this.teamLoader.byUserId.load(user.id);
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
