import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import {
  UserNotFoundException,
  TeamNotFoundException,
  UserTeamRelationExistsException,
  UserTeamRelationNotFoundException,
  UserOperationFailedException,
} from '../exceptions/user.exceptions';

@Injectable()
export class UserTeamService {
  constructor(
    @InjectPinoLogger(UserTeamService.name) private readonly logger: PinoLogger,
    private prisma: PrismaService,
  ) {}

  async addUserToTeam(userId: number, teamId: string): Promise<User> {
    this.logger.info({ userId, teamId }, 'Adding user to team');

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Verify both user and team exist
        const [userExists, teamExists] = await Promise.all([
          tx.user.findUnique({ where: { id: userId }, select: { id: true } }),
          tx.team.findUnique({ where: { id: teamId }, select: { id: true } }),
        ]);

        if (!userExists) {
          throw new UserNotFoundException(userId, 'team assignment');
        }

        if (!teamExists) {
          throw new TeamNotFoundException(teamId, 'user assignment');
        }

        // Check if relation already exists
        const existingRelation = await tx.userTeam.findUnique({
          where: {
            userId_teamId: {
              userId,
              teamId,
            },
          },
        });

        if (existingRelation) {
          this.logger.info(
            { userId, teamId },
            'User is already a member of the team',
          );
          // Could throw UserTeamRelationExistsException or just return current state
          // For now, we'll be idempotent and not throw an error
        } else {
          await tx.userTeam.create({
            data: {
              userId,
              teamId,
            },
          });
          this.logger.debug(
            { userId, teamId },
            'Created new UserTeam relation',
          );
        }

        // Get the full user record for the response
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new UserNotFoundException(
            userId,
            'retrieving user after team assignment',
          );
        }

        return user;
      });
    } catch (error) {
      if (
        error instanceof UserNotFoundException ||
        error instanceof TeamNotFoundException ||
        error instanceof UserTeamRelationExistsException
      ) {
        throw error;
      }

      this.logger.error(
        { err: error, userId, teamId },
        'Failed to add user to team',
      );
      throw new UserOperationFailedException(
        'add to team',
        userId,
        error as Error,
      );
    }
  }

  async removeUserFromTeam(userId: number, teamId: string): Promise<User> {
    this.logger.info({ userId, teamId }, 'Removing user from team');

    try {
      // First verify the relationship exists
      const existingRelation = await this.prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });

      if (!existingRelation) {
        throw new UserTeamRelationNotFoundException(userId, teamId);
      }

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
        throw new UserNotFoundException(
          userId,
          'retrieving user after team removal',
        );
      }

      this.logger.trace(
        { userId },
        'User team state after removal (fetched post-tx)',
      );

      return updatedUser;
    } catch (error) {
      if (
        error instanceof UserTeamRelationNotFoundException ||
        error instanceof UserNotFoundException
      ) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2028'
      ) {
        this.logger.error(
          { err: error, userId, teamId },
          'Transaction timeout during user removal',
        );
        throw new UserOperationFailedException(
          'remove from team (timeout)',
          userId,
          error,
        );
      }

      this.logger.error(
        { err: error, userId, teamId },
        'Failed to remove user from team',
      );
      throw new UserOperationFailedException(
        'remove from team',
        userId,
        error as Error,
      );
    }
  }

  async getUserWithTeams(userId: number): Promise<User | null> {
    this.logger.trace(
      { userId },
      'Fetching user (teams will be loaded by field resolvers)',
    );

    // Only fetch the basic user data
    // Team data will be efficiently loaded by DataLoaders when requested
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
