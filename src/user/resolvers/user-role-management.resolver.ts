import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Throttle } from '@nestjs/throttler';
import { User } from '../user.model';
import { UserRoleService } from '../services/user-role.service';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { UpdateUserRoleInput } from '../user.input';

@Resolver(() => User)
export class UserRoleManagementResolver {
  constructor(
    @InjectPinoLogger(UserRoleManagementResolver.name)
    private readonly logger: PinoLogger,
    private userRoleService: UserRoleService,
  ) {}

  @Mutation(() => User)
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 10, ttl: 300000 } }) // 10 role updates per 5 minutes
  async updateUserRole(
    @Args('input') input: UpdateUserRoleInput,
  ): Promise<User> {
    this.logger.info({ input }, 'Executing updateUserRole mutation');
    const updatedUser = await this.userRoleService.updateUserRole(
      input.userId,
      input.newRole,
    );
    return {
      ...updatedUser,
      role: updatedUser.role,
    };
  }
}
