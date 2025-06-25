import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Team } from '@prisma/client';
import { SimpleTeamDTO } from './team.model';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class TeamService {
  constructor(
    @InjectPinoLogger(TeamService.name)
    private readonly logger: PinoLogger,
    private prisma: PrismaService,
  ) {}

  async create(id: string, name: string): Promise<Team> {
    this.logger.debug({ teamId: id, name }, 'Creating team');
    return this.prisma.$transaction(async (tx) => {
      return tx.team.create({
        data: {
          id,
          name,
          projects: { create: [] },
          rates: { create: [] },
        },
      });
    });
  }

  async getAllSimpleTeams(): Promise<SimpleTeamDTO[]> {
    this.logger.debug('Fetching all teams (simple format)');

    return this.prisma.$transaction(async (tx) => {
      return tx.team.findMany({
        select: {
          id: true,
          name: true,
        },
      });
    });
  }

  async getTeamById(id: string): Promise<Team | null> {
    this.logger.debug({ teamId: id }, 'Fetching team by id');

    return this.prisma.$transaction(async (tx) => {
      return tx.team.findUnique({
        where: { id },
      });
    });
  }
}
