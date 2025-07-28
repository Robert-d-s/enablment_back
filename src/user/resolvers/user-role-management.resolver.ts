import { Args, Mutation, Resolver } from '@nestjs/graphql';
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
}
