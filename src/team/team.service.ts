import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Team } from '@prisma/client';
import { SimpleTeamDTO } from './team.dto';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  async syncTeam(id: string, name: string): Promise<void> {
    await this.prisma.team.upsert({
      where: { id },
      update: { name },
      create: { id, name },
    });
  }

  async create(id: string, name: string): Promise<Team> {
    return await this.prisma.team.create({
      data: {
        id,
        name,
        projects: { create: [] },
        rates: { create: [] },
      },
    });
  }

  async getAllTeams(): Promise<{ id: string }[]> {
    return await this.prisma.team.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }

  async getAllSimpleTeams(): Promise<SimpleTeamDTO[]> {
    return await this.prisma.team.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }

  async deleteTeam(teamId: string): Promise<void> {
    await this.prisma.$transaction(async (prisma) => {
      // First find all issues associated with this team
      const issuesWithTeam = await this.prisma.issue.findMany({
        where: {
          teamKey: teamId,
        },
      });

      // Update all issues to remove team references
      if (issuesWithTeam.length > 0) {
        await this.prisma.issue.updateMany({
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
      await this.prisma.team.delete({
        where: { id: teamId },
      });
    });
  }

  async getTeamById(id: string): Promise<Team | null> {
    return await this.prisma.team.findUnique({
      where: { id },
    });
  }
}
