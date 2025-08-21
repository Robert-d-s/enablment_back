import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../prisma/prisma.service';
import { Project } from '@prisma/client';

@Injectable({ scope: Scope.REQUEST })
export class ProjectLoader {
  constructor(private prisma: PrismaService) {}

  readonly byId = new DataLoader<string, Project | null>(
    async (ids: readonly string[]) => {
      const projects = await this.prisma.project.findMany({
        where: {
          id: { in: [...ids] },
        },
      });

      const projectMap = new Map(
        projects.map((project) => [project.id, project]),
      );

      // Return null instead of undefined for missing values
      return ids.map((id) => projectMap.get(id) || null);
    },
  );

  readonly byTeamId = new DataLoader<string, Project[]>(
    async (teamIds: readonly string[]) => {
      const projects = await this.prisma.project.findMany({
        where: {
          teamId: { in: [...teamIds] },
        },
      });

      const teamProjectsMap = new Map<string, Project[]>();

      teamIds.forEach((id) => {
        teamProjectsMap.set(id, []);
      });

      projects.forEach((project) => {
        const teamProjects = teamProjectsMap.get(project.teamId) || [];
        teamProjects.push(project);
        teamProjectsMap.set(project.teamId, teamProjects);
      });

      return teamIds.map((id) => teamProjectsMap.get(id) || []);
    },
  );
}
