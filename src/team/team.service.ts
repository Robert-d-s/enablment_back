import { Injectable } from '@nestjs/common';
import { PrismaClient, Team } from '@prisma/client';
import { LinearService } from './linear.service';
import { TeamsDTO } from './team.dto';
import { SimpleTeamDTO } from './team.dto';

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
        name: true,
      },
    });
  }

  async getAllSimpleTeams(): Promise<SimpleTeamDTO[]> {
    return await prisma.team.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }

  // async deleteTeam(id: string): Promise<void> {
  //   await prisma.team.delete({
  //     where: { id },
  //   });
  // }
  async deleteTeam(id: string): Promise<void> {
    // Start a transaction
    const transaction = await prisma.$transaction(async (prisma) => {
      // Retrieve and delete all projects associated with the team
      await prisma.project.deleteMany({
        where: { teamId: id },
      });

      // Now delete the team
      await prisma.team.delete({
        where: { id },
      });
    });

    // Optionally, you can handle the result of the transaction
    // For example, logging the result or handling errors
  }

  async getTeams(): Promise<TeamsDTO> {
    return await this.linearService.fetchTeams();
  }

  async getTeamById(id: string): Promise<Team | null> {
    return await prisma.team.findUnique({
      where: { id },
    });
  }
}
