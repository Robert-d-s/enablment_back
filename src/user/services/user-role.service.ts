import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class UserRoleService {
  constructor(
    @InjectPinoLogger(UserRoleService.name) private readonly logger: PinoLogger,
    private prisma: PrismaService,
  ) {}

  async updateUserRole(userId: number, newRole: UserRole): Promise<User> {
    this.logger.info({ userId, newRole }, 'Updating user role');
    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role: newRole,
      },
    });

    // Note: When a user's role changes, their current JWT tokens will still contain the old role
    // until they expire. Consider implementing one of these solutions:
    // 1. Use shorter token expiration times (current implementation relies on this)
    // 2. Implement token blacklisting/invalidation
    // 3. Add a "tokenVersion" field to user and increment it on role changes
    // 4. Store role changes with timestamps and validate against token issuance time
    this.logger.warn(
      { userId, newRole },
      'User role updated - existing JWT tokens will retain old role until expiration',
    );

    return updatedUser;
  }

  async canUserAccessTeam(userId: number, teamId: string): Promise<boolean> {
    this.logger.debug({ userId, teamId }, 'Checking user team access');

    const userTeam = await this.prisma.userTeam.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    return !!userTeam;
  }

  async getUserPermissions(userId: number): Promise<{
    role: UserRole;
    teamIds: string[];
  }> {
    this.logger.debug({ userId }, 'Getting user permissions');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        teams: {
          select: {
            teamId: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    return {
      role: user.role,
      teamIds: user.teams.map((t) => t.teamId),
    };
  }
}
