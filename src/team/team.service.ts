import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Team } from '@prisma/client';
import { SimpleTeamDTO } from './team.model';

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(private prisma: PrismaService) {}

  async create(id: string, name: string): Promise<Team> {
    this.logger.debug(`Creating team with id: ${id}, name: ${name}`);

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
    this.logger.debug(`Fetching team with id: ${id}`);

    return this.prisma.$transaction(async (tx) => {
      return tx.team.findUnique({
        where: { id },
      });
    });
  }
}
