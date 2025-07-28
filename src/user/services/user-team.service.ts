import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import {
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';

type TeamBasic = {
  id: string;
  name: string;
};

@Injectable()
export class UserTeamService {
  constructor(
    @InjectPinoLogger(UserTeamService.name) private readonly logger: PinoLogger,
    private prisma: PrismaService,
  ) {}

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
          {
            userId,
            teamId,
            userExists: !!userExists,
            teamExists: !!teamExists,
          },
          'User or Team not found for adding relation',
        );
        throw new BadRequestException('User or Team not found');
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
        throw new BadRequestException(
          `User with ID ${userId} not found after adding to team`,
        );
      }

      return user;
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

  async getUserWithTeams(userId: number): Promise<any> {
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
}
