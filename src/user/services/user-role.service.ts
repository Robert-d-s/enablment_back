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
        // Increment token version to invalidate all existing JWT tokens
        tokenVersion: {
          increment: 1,
        },
      },
    });

    this.logger.info(
      {
        userId,
        newRole,
        newTokenVersion: updatedUser.tokenVersion,
      },
      'User role updated and token version incremented - all existing tokens invalidated',
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

  /**
   * Emergency method to invalidate all tokens for a user
   * Useful for security incidents or when user account is compromised
   */
  async invalidateAllUserTokens(userId: number): Promise<User> {
    this.logger.warn(
      { userId },
      'Invalidating all tokens for user - emergency action',
    );

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        tokenVersion: {
          increment: 1,
        },
      },
    });

    this.logger.info(
      {
        userId,
        newTokenVersion: updatedUser.tokenVersion,
      },
      'All user tokens invalidated successfully',
    );

    return updatedUser;
  }
}
