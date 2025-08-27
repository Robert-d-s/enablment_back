import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Throttle } from '@nestjs/throttler';
import { User } from '../user.model';
import { UserTeamService } from '../services/user-team.service';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { UserTeamInput } from '../user.input';

@Resolver(() => User)
export class UserTeamManagementResolver {
  constructor(
    @InjectPinoLogger(UserTeamManagementResolver.name)
    private readonly logger: PinoLogger,
    private userTeamService: UserTeamService,
  ) {}

  @Mutation(() => User)
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 15, ttl: 300000 } }) // 15 team operations per 5 minutes
  async addUserToTeam(@Args('input') input: UserTeamInput): Promise<User> {
    this.logger.info({ input }, 'Executing addUserToTeam mutation');
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
  @Throttle({ default: { limit: 15, ttl: 300000 } }) // 15 team operations per 5 minutes
  async removeUserFromTeam(@Args('input') input: UserTeamInput): Promise<User> {
    this.logger.info({ input }, 'Executing removeUserFromTeam mutation');
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
