import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole, Prisma } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import {
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { UserQueryArgs } from './user.resolver';
import * as bcrypt from 'bcrypt';

type TeamBasic = {
  id: string;
  name: string;
};

type UserTeamDTO = {
  userId: number;
  teamId: string;
  user: {
    id: number;
    email: string;
    password?: string | null;
    role: UserRole;
  };
  team: TeamBasic;
};

@Injectable()
export class UserService {
  constructor(
    @InjectPinoLogger(UserService.name) private readonly logger: PinoLogger,
    private prisma: PrismaService,
  ) {}
  async findOne(email: string): Promise<User | undefined> {
    this.logger.debug({ email }, 'Finding user by email');
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (user) {
      return {
        ...user,
        role: UserRole[user.role as keyof typeof UserRole],
      };
    }

    return undefined;
  }

  async create(
    email: string,
    hashedPassword: string,
    role: UserRole,
  ): Promise<User> {
    this.logger.info({ email, role }, 'Creating user');
    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });
  }

  async count(): Promise<number> {
    this.logger.debug('Counting all users');
    return this.prisma.user.count();
  }

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

    return {
      ...updatedUser,
      role: UserRole[updatedUser.role as keyof typeof UserRole],
    };
  }

  async addUserToTeam(userId: number, teamId: string): Promise<User> {
    this.logger.info({ userId, teamId }, 'Adding user to team');
    return this.prisma.$transaction(async (tx) => {
      const userExists = await tx.user.findUnique({
        where: { id: userId },
      });
      const teamExists = await tx.team.findUnique({
        where: { id: teamId },
      });

      if (!userExists || !teamExists) {
        this.logger.error(
          { userId, teamId, userExists, teamExists },
          'User or Team not found for adding relation',
        );
        throw new Error('User or Team not found');
      }

      const existingRelation = await tx.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });

      if (!existingRelation) {
        await tx.userTeam.create({
          data: {
            userId,
            teamId,
          },
        });
      }
      this.logger.debug(
        { userId, teamId },
        'Created UserTeam relation if it did not exist',
      );
      // Get the updated user with teams within the transaction
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: {
          teams: {
            include: {
              team: {
                include: {
                  projects: true,
                  rates: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        this.logger.error(
          { userId },
          'User not found after adding to team within transaction',
        );
        throw new Error(
          `User with ID ${userId} not found after adding to team`,
        );
      }

      return user;
    });
  }

  private async getUserWithTeams(userId: number): Promise<any> {
    this.logger.trace({ userId }, 'Fetching user with teams');
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        teams: {
          include: {
            team: {
              include: {
                projects: true,
                rates: true,
              },
            },
          },
        },
      },
    });
  }

  async removeUserFromTeam(userId: number, teamId: string): Promise<User> {
    this.logger.info({ userId, teamId }, 'Removing user from team');
    try {
      await this.prisma.$transaction(async (tx) => {
        this.logger.debug(
          { userId, teamId },
          'Executing deleteMany within transaction',
        );
        await tx.userTeam.deleteMany({
          where: {
            userId: userId,
            teamId: teamId,
          },
        });
      });

      this.logger.info(
        { userId, teamId },
        'Successfully removed UserTeam relation',
      );
      const updatedUser = await this.getUserWithTeams(userId);
      if (!updatedUser) {
        this.logger.error(
          { userId },
          'User not found after successful team removal',
        );
        throw new InternalServerErrorException(
          'Failed to retrieve user state after update',
        );
      }
      this.logger.trace(
        { userId, teamCount: updatedUser?.teams?.length ?? 0 },
        'User team state after removal (fetched post-tx)',
      );

      return updatedUser;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2028'
      ) {
        this.logger.error(
          { err: error, userId, teamId },
          'Transaction timeout during user removal',
        );
        throw new InternalServerErrorException(
          'Database operation timed out during team removal.',
        );
      } else {
        this.logger.error(
          { err: error, userId, teamId },
          'Failed to remove user from team',
        );
        throw error;
      }
    }
  }

  async countUsersWithFilters(args: {
    search?: string;
    role?: UserRole;
  }): Promise<number> {
    this.logger.debug({ filterArgs: args }, 'Counting users with filters');
    const where: Prisma.UserWhereInput = {};
    if (args.search) {
      where.email = { contains: args.search };
    }
    if (args.role) {
      where.role = args.role;
    }
    return this.prisma.user.count({ where });
  }

  // Method to Find users with filters and pagination (Required for users query)
  async findUsers(
    args: UserQueryArgs,
  ): Promise<Array<Pick<User, 'id' | 'email' | 'role'>>> {
    // Return type matches resolver needs
    this.logger.debug(
      { queryArgs: args },
      'Finding users with filters and pagination',
    );
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

    // Return only the fields needed by the resolver/GraphQL type
    return this.prisma.user.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        email: true,
        role: true, // Prisma returns the enum value
      },
      orderBy: {
        email: 'asc',
      },
    });
  }

  async findById(userId: number): Promise<User | null> {
    this.logger.debug({ userId }, 'Finding user by ID');
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      return {
        ...user,
        role: UserRole[user.role as keyof typeof UserRole],
      };
    }

    return null;
  }

  async hashData(data: string): Promise<string> {
    return bcrypt.hash(data, 10);
  }

  async updateRefreshTokenHash(
    userId: number,
    hashedRefreshToken: string | null,
  ): Promise<void> {
    this.logger.debug(`Updating refresh token hash for user ${userId}`);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        hashedRefreshToken: hashedRefreshToken,
      },
    });
  }

  async clearRefreshToken(userId: number): Promise<void> {
    this.logger.debug(`Clearing refresh token for user ${userId}`);
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        hashedRefreshToken: { not: null },
      },
      data: {
        hashedRefreshToken: null,
      },
    });
  }

  async clearAllRefreshTokens(): Promise<number> {
    this.logger.info('Clearing all refresh tokens');
    const result = await this.prisma.user.updateMany({
      where: {
        hashedRefreshToken: { not: null },
      },
      data: {
        hashedRefreshToken: null,
      },
    });

    this.logger.info(`Cleared refresh tokens for ${result.count} users`);
    return result.count;
  }

  async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async verifyRefreshToken(
    providedToken: string,
    hashedToken: string,
  ): Promise<boolean> {
    return bcrypt.compare(providedToken, hashedToken);
  }

  validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }
  }

  validatePassword(password: string): void {
    if (!password) {
      throw new BadRequestException('Password is required');
    }

    if (password.length < 6) {
      throw new BadRequestException(
        'Password must be at least 6 characters long',
      );
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!(hasUpperCase && hasLowerCase && (hasNumbers || hasSpecialChar))) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter, one lowercase letter, and either a number or special character',
      );
    }
  }
}
