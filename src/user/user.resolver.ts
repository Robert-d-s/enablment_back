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
  Context,
} from '@nestjs/graphql';
import { UnauthorizedException } from '@nestjs/common';
import { User } from './user.model';
import { UserCoreService } from './user-core.service';
import { UserRoleService } from './services/user-role.service';
import { UserTeamService } from './services/user-team.service';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { TeamLoader } from '../loaders/team.loader';
import { Team } from '../team/team.model';
import { ProjectLoader } from '../loaders/project.loader';
import { Project } from '../project/project.model';
import { UserProfileDto } from '../auth/dto/user-profile.dto';
import { IsOptional, IsInt, IsString, IsEnum } from 'class-validator';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { UpdateUserRoleInput, UserTeamInput } from './user.input';
import { GqlContext } from '../app.module';

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
    private userCoreService: UserCoreService,
    private userRoleService: UserRoleService,
    private userTeamService: UserTeamService,
    private teamLoader: TeamLoader,
    private projectLoader: ProjectLoader,
  ) {}

  @Query(() => [Project])
  async myProjects(@Context() context: GqlContext): Promise<Project[]> {
    const currentUser = context.req.user as UserProfileDto;
    this.logger.debug({ userId: currentUser.id }, 'Executing myProjects query');

    if (!currentUser) {
      throw new UnauthorizedException();
    }

    // Single optimized query to get user's teams with their projects
    const userTeams = await this.teamLoader.byUserId.load(currentUser.id);
    if (!userTeams || userTeams.length === 0) {
      return [];
    }

    // Efficiently get all projects for user's teams in one batch
    const teamIds = userTeams.map((team) => team.id);
    const projectsPerTeam = await this.projectLoader.byTeamId.loadMany(teamIds);

    // Create team name lookup map from already loaded data
    const teamNameMap = new Map<string, string>();
    userTeams.forEach((team) => {
      teamNameMap.set(team.id, team.name);
    });

    // Process and enrich projects with team names
    const allProjects = projectsPerTeam
      .flat()
      .filter((p): p is Project => p instanceof Error === false && p !== null)
      .map((project) => ({
        ...project,
        teamName: teamNameMap.get(project.teamId) || 'Unknown Team',
      }));

    this.logger.debug(
      {
        userId: currentUser.id,
        teamCount: userTeams.length,
        projectCount: allProjects.length,
      },
      'Successfully loaded user projects',
    );

    return allProjects;
  }

  @Query(() => Int)
  @Roles(UserRole.ADMIN, UserRole.ENABLER)
  async usersCount(
    @Args('search', { type: () => String, nullable: true }) search?: string,
    @Args('role', { type: () => UserRole, nullable: true }) role?: UserRole,
  ): Promise<number> {
    this.logger.debug(
      { search, role },
      'Executing usersCount query (delegating to service)',
    );
    return this.userCoreService.countUsersWithFilters({ search, role });
  }

  @Query(() => [User])
  @Roles(UserRole.ADMIN, UserRole.ENABLER)
  async users(@Args('args') args: UserQueryArgs): Promise<User[]> {
    this.logger.debug(
      { queryArgs: args },
      'Executing users query (delegating to service)',
    );
    const usersFromService = await this.userCoreService.findUsers(args);
    return usersFromService.map(
      (user: Pick<User, 'id' | 'email' | 'role'>) => ({
        id: user.id,
        email: user.email,
        role: user.role,
      }),
    );
  }

  @ResolveField(() => [Team])
  async teams(@Parent() user: User): Promise<Team[]> {
    this.logger.trace({ userId: user.id }, 'Resolving teams field for User');

    const teams = await this.teamLoader.byUserId.load(user.id);

    // Return teams with properly initialized empty arrays
    // Note: If clients need projects/rates, they should use dedicated queries
    // This prevents N+1 problems while keeping the resolver simple
    return teams.map((team) => ({
      ...team,
      projects: [], // Empty by design - use dedicated queries for project data
      rates: [], // Empty by design - use dedicated queries for rate data
    }));
  }

  @Mutation(() => User)
  @Roles(UserRole.ADMIN)
  async updateUserRole(
    @Args('input') input: UpdateUserRoleInput,
  ): Promise<User> {
    this.logger.info({ input }, 'Executing updateUserRole mutation');
    // Let custom exceptions bubble up with proper error codes
    const updatedUser = await this.userRoleService.updateUserRole(
      input.userId,
      input.newRole,
    );
    return {
      ...updatedUser,
      role: updatedUser.role,
    };
  }

  @Mutation(() => User)
  @Roles(UserRole.ADMIN)
  async addUserToTeam(@Args('input') input: UserTeamInput): Promise<User> {
    this.logger.info({ input }, 'Executing addUserToTeam mutation');
    // Let custom exceptions bubble up with proper error codes
    const user = await this.userTeamService.addUserToTeam(
      input.userId,
      input.teamId,
    );
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  @Mutation(() => User)
  @Roles(UserRole.ADMIN)
  async removeUserFromTeam(@Args('input') input: UserTeamInput): Promise<User> {
    this.logger.info({ input }, 'Executing removeUserFromTeam mutation');
    // No try-catch needed - let the custom exceptions bubble up
    // They provide proper HTTP status codes and error messages
    const user = await this.userTeamService.removeUserFromTeam(
      input.userId,
      input.teamId,
    );
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
