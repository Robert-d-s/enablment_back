import { Injectable } from '@nestjs/common';
import { PrismaClient, Team } from '@prisma/client';
import { SimpleTeamDTO } from './team.dto';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

@Injectable()
export class TeamService {
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

  async deleteTeam(teamId: string): Promise<void> {
    await prisma.$transaction(async (prisma) => {
      // First find all issues associated with this team
      const issuesWithTeam = await prisma.issue.findMany({
        where: {
          teamKey: teamId,
        },
      });

      // Update all issues to remove team references
      if (issuesWithTeam.length > 0) {
        await prisma.issue.updateMany({
          where: {
            teamKey: teamId,
          },
          data: {
            teamKey: null,
            teamName: null,
          },
        });
      }

      // Now delete the team
      await prisma.team.delete({
        where: { id: teamId },
      });
    });
  }

  async getTeamById(id: string): Promise<Team | null> {
    return await prisma.team.findUnique({
      where: { id },
    });
  }
}
