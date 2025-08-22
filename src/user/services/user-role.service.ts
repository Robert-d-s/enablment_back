import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { TokenBlacklistService } from '../../common/services/token-blacklist.service';
import {
  UserNotFoundException,
  UserOperationFailedException,
  InvalidRoleChangeException,
} from '../exceptions/user.exceptions';

@Injectable()
export class UserRoleService {
  constructor(
    @InjectPinoLogger(UserRoleService.name)
    private readonly logger: PinoLogger,
    private prisma: PrismaService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {}

  async updateUserRole(userId: number, newRole: UserRole): Promise<User> {
    this.logger.info({ userId, newRole }, 'Updating user role');

    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });

      if (!existingUser) {
        throw new UserNotFoundException(userId, 'role update');
      }

      if (existingUser.role === newRole) {
        this.logger.warn(
          { userId, currentRole: existingUser.role, newRole },
          'Attempted to set user to same role they already have',
        );
        throw new InvalidRoleChangeException(
          existingUser.role,
          newRole,
          'User already has this role',
        );
      }

      const updatedUser = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          role: newRole,
          tokenVersion: {
            increment: 1,
          },
        },
      });

      try {
        this.tokenBlacklistService.blacklistUserTokens(userId);
      } catch (err) {
        this.logger.debug(
          { err, userId },
          'Token blacklist service call failed (non-fatal)',
        );
      }

      this.logger.info(
        {
          userId,
          oldRole: existingUser.role,
          newRole,
          newTokenVersion: updatedUser.tokenVersion,
        },
        'User role updated and token version incremented - all existing tokens invalidated',
      );

      return updatedUser;
    } catch (error) {
      if (
        error instanceof UserNotFoundException ||
        error instanceof InvalidRoleChangeException
      ) {
        throw error;
      }

      this.logger.error(
        { err: error, userId, newRole },
        'Failed to update user role',
      );
      throw new UserOperationFailedException(
        'update role',
        userId,
        error as Error,
      );
    }
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

    try {
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
        throw new UserNotFoundException(userId, 'permissions lookup');
      }

      return {
        role: user.role,
        teamIds: user.teams.map((t) => t.teamId),
      };
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw error;
      }

      this.logger.error(
        { err: error, userId },
        'Failed to get user permissions',
      );
      throw new UserOperationFailedException(
        'get permissions',
        userId,
        error as Error,
      );
    }
  }
}
