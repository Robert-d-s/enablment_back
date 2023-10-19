import { Injectable } from '@nestjs/common';
import { PrismaClient, Team } from '@prisma/client';
import { LinearService } from './linear.service';
import { TeamsDTO } from './team.dto';

// const prisma = new PrismaClient();
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

@Injectable()
export class TeamService {
  constructor(private readonly linearService: LinearService) {}

  async syncTeamsFromLinear() {
    await this.linearService.synchronizeTeamsWithLinear();
  }

  async syncTeam(id: string, name: string): Promise<void> {
    await prisma.team.upsert({
      where: { id },
      update: { name },
      create: { id, name },
    });
  }

  async create(id: string, name: string): Promise<Team> {
    return await prisma.team.create({
      data: {
        id,
        name,
        projects: { create: [] },
        rates: { create: [] },
      },
    });
  }

  async getAllTeams(): Promise<{ id: string }[]> {
    return await prisma.team.findMany({
      select: {
        id: true,
      },
    });
  }

  async deleteTeam(id: string): Promise<void> {
    await prisma.team.delete({
      where: { id },
    });
  }

  async getTeams(): Promise<TeamsDTO> {
    return await this.linearService.fetchTeams();
  }
  // ----------------------------------------------------------------
  async getTeamById(id: string): Promise<Team | null> {
    return await prisma.team.findUnique({
      where: { id },
    });
  }

  // ----------------------------------------------------------------
}
