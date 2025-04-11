import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Project, Team } from '@prisma/client';
import { TeamLoader } from '../loaders/team.loader';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private teamLoader: TeamLoader,
  ) {}

  async all(): Promise<Array<Project & { teamName?: string }>> {
    const projects = await this.prisma.project.findMany({
      orderBy: { name: 'asc' },
    });
    if (!projects || projects.length === 0) {
      return [];
    }
    const teamIds = [...new Set(projects.map((p) => p.teamId))];
    const teams = await this.teamLoader.byId.loadMany(teamIds);
    const teamMap = new Map<string, Team>();
    teams.forEach((t) => {
      if (t && !(t instanceof Error)) {
        teamMap.set(t.id, t);
      }
    });
    const projectsWithTeamNames = projects.map((project) => ({
      ...project,
      teamName: teamMap.get(project.teamId)?.name,
    }));
    return projectsWithTeamNames;
  }

  async create(
    id: string,
    name: string,
    teamId: string,
    createdAt: string,
    updatedAt: string,
    description: string,
    state: string,
    startDate: string,
    targetDate: string,
  ): Promise<Project> {
    return this.prisma.project.create({
      data: {
        id,
        name,
        team: {
          connect: { id: teamId },
        },
        createdAt,
        updatedAt,
        description,
        state,
        startDate,
        targetDate,
      },
    });
  }

  async remove(id: string): Promise<Project | null> {
    try {
      return await this.prisma.project.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error in removing project:', error);
      // Handle or rethrow the error as appropriate
      return null;
    }
  }

  async update(
    id: string,
    name: string,
    teamId: string,
    createdAt: string,
    updatedAt: string,
    description: string,
    state: string,
    startDate: string,
    targetDate: string,
  ): Promise<Project> {
    return this.prisma.project.upsert({
      where: {
        id,
      },
      update: {
        name,
        teamId,
        updatedAt,
        description,
        state,
        startDate,
        targetDate,
      },
      create: {
        id,
        name,
        teamId,
        createdAt,
        updatedAt,
        description,
        state,
        startDate,
        targetDate,
      },
    });
  }
}
