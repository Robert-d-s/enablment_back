import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Team, Prisma } from '@prisma/client';
import { SimpleTeamDTO } from './team.model';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import {
  TeamNotFoundException,
  TeamAlreadyExistsException,
  TeamOperationFailedException,
} from './exceptions/team.exceptions';

@Injectable()
export class TeamService {
  constructor(
    @InjectPinoLogger(TeamService.name)
    private readonly logger: PinoLogger,
    private prisma: PrismaService,
  ) {}

  async create(id: string, name: string): Promise<Team> {
    this.logger.debug({ teamId: id, name }, 'Creating team');

    try {
      const existingTeam = await this.prisma.team.findUnique({
        where: { id },
        select: { id: true },
      });

      if (existingTeam) {
        throw new TeamAlreadyExistsException(id);
      }

      return this.prisma.$transaction(async (tx) => {
        return tx.team.create({
          data: {
            id,
            name,
          },
        });
      });
    } catch (error) {
      if (error instanceof TeamAlreadyExistsException) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new TeamAlreadyExistsException(id);
        }
      }

      this.logger.error(
        { err: error, teamId: id, name },
        'Failed to create team',
      );
      throw new TeamOperationFailedException('create', id, error as Error);
    }
  }

  async getAllSimpleTeams(): Promise<SimpleTeamDTO[]> {
    this.logger.debug('Fetching all teams (simple format)');

    try {
      return this.prisma.$transaction(async (tx) => {
        return tx.team.findMany({
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: 'asc',
          },
        });
      });
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to fetch teams');
      throw new TeamOperationFailedException(
        'fetch teams',
        'all',
        error as Error,
      );
    }
  }

  async getTeamById(id: string): Promise<Team> {
    this.logger.debug({ teamId: id }, 'Fetching team by id');

    try {
      return this.prisma.$transaction(async (tx) => {
        const team = await tx.team.findUnique({
          where: { id },
        });

        if (!team) {
          throw new TeamNotFoundException(id, 'lookup');
        }

        return team;
      });
    } catch (error) {
      if (error instanceof TeamNotFoundException) {
        throw error;
      }

      this.logger.error({ err: error, teamId: id }, 'Failed to fetch team');
      throw new TeamOperationFailedException('fetch', id, error as Error);
    }
  }
}
