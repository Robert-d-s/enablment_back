import {
  Args,
  Mutation,
  Query,
  Resolver,
  Int,
  ResolveField,
  Parent,
  Field,
  InputType,
} from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { User } from './user.model';
import { UserService } from './user.service';
import { Roles } from '../auth/roles.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { Prisma, UserRole } from '@prisma/client';
import { TeamLoader } from '../loaders/team.loader';
import { Team } from '../team/team.model';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectLoader } from '../loaders/project.loader';
import { Project } from '../project/project.model';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserProfileDto } from '../auth/dto/user-profile.dto';
import { IsOptional, IsInt, IsString, IsEnum } from 'class-validator';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@InputType()
export class UserQueryArgs {
  @Field(() => Int, { defaultValue: 1, nullable: true })
  @IsOptional()
  @IsInt()
  page?: number;

  @Field(() => Int, { defaultValue: 10, nullable: true })
  @IsOptional()
  @IsInt()
  pageSize?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => UserRole, { nullable: true })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

@Resolver(() => User)
export class UserResolver {
  constructor(
    @InjectPinoLogger(UserResolver.name) private readonly logger: PinoLogger,
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
    this.logger.debug({ userId: currentUser.id }, 'Executing myProjects query');
    if (!currentUser) {
      throw new UnauthorizedException();
    }
    const teams = await this.teamLoader.byUserId.load(currentUser.id);
    if (!teams || teams.length === 0) {
      return [];
    }
    const teamIds = teams.map((team) => team.id);
    const projectsPerTeam = await this.projectLoader.byTeamId.loadMany(teamIds);
    const allProjectsRaw = (
      projectsPerTeam.flat() as Array<Project | Error | null>
    ).filter((p): p is Project => p instanceof Error === false && p !== null);
    if (allProjectsRaw.length === 0) {
      return [];
    }

    const projectTeamIds = [...new Set(allProjectsRaw.map((p) => p.teamId))];
    const correspondingTeams =
      await this.teamLoader.byId.loadMany(projectTeamIds);
    const teamNameMap = new Map<string, string>();
    correspondingTeams.forEach((team) => {
      if (team && !(team instanceof Error)) {
        teamNameMap.set(team.id, team.name);
      }
    });
    const allProjectsWithTeamName = allProjectsRaw.map((project) => ({
      ...project,
      teamName: teamNameMap.get(project.teamId) || 'Unknown Team',
    }));
    return allProjectsWithTeamName;
  }

  @Query(() => Int)
  @Roles(UserRole.ADMIN, UserRole.ENABLER)
  @UseGuards(AuthGuard)
  async usersCount(
    @Args('search', { type: () => String, nullable: true }) search?: string,
    @Args('role', { type: () => UserRole, nullable: true }) role?: UserRole,
  ): Promise<number> {
    this.logger.debug({ search, role }, 'Executing usersCount query');
    const where: Prisma.UserWhereInput = {};
    if (search) {
      where.email = { contains: search };
    }
    if (role) {
      where.role = role;
    }
    return this.prisma.user.count({ where });
  }

  @Query(() => [User])
  @Roles(UserRole.ADMIN, UserRole.ENABLER)
  @UseGuards(AuthGuard)
  async users(@Args('args') args: UserQueryArgs): Promise<User[]> {
    this.logger.debug({ queryArgs: args }, 'Executing users query');
    const currentPage = args.page ?? 1;
    const currentPageSize = args.pageSize ?? 10;

    const skip = (currentPage - 1) * currentPageSize;
    const take = currentPageSize;

    const where: Prisma.UserWhereInput = {};
    if (args.search) {
      where.email = { contains: args.search };
    }
    if (args.role) {
      where.role = args.role;
    }

    const users = await this.prisma.user.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        email: true,
        role: true,
      },
      orderBy: {
        email: 'asc',
      },
    });

    return users.map((user) => ({
      ...user,
      role: user.role as UserRole,
    }));
  }

  @ResolveField(() => [Team])
  async teams(@Parent() user: User): Promise<Team[]> {
    this.logger.trace({ userId: user.id }, 'Resolving teams field for User');
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
    this.logger.info({ userId, newRole }, 'Executing updateUserRole mutation');
    const updatedUser = await this.userService.updateUserRole(userId, newRole);
    return {
      ...updatedUser,
      role: updatedUser.role as UserRole,
    };
  }

  @Mutation(() => User)
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  async addUserToTeam(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('teamId') teamId: string,
  ): Promise<User> {
    this.logger.info({ userId, teamId }, 'Executing addUserToTeam mutation');
    const user = await this.userService.addUserToTeam(userId, teamId);
    return {
      ...user,
      role: user.role as UserRole,
    };
  }

  @Mutation(() => User)
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  async removeUserFromTeam(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('teamId') teamId: string,
  ): Promise<User> {
    this.logger.info({ userId, teamId }, 'Executing removeUserFromTeam mutation');
    try {
      const user = await this.userService.removeUserFromTeam(userId, teamId);
      return {
        ...user,
        role: user.role as UserRole,
      };
    } catch (error) {
      this.logger.error({ err: error, userId, teamId }, 'Error occurred while removing user from team');
      throw new Error('Error removing user from team');
    }
  }
}
