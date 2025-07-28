import {
  Args,
  Query,
  Resolver,
  Int,
  ResolveField,
  Parent,
  Field,
  InputType,
} from '@nestjs/graphql';
import { User } from './user.model';
import { UserCoreService } from './user-core.service';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { TeamLoader } from '../loaders/team.loader';
import { Team } from '../team/team.model';
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
    @InjectPinoLogger(UserResolver.name)
    private readonly logger: PinoLogger,
    private userCoreService: UserCoreService,
    private teamLoader: TeamLoader,
  ) {}

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
}
