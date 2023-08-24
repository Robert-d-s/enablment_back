import { Injectable } from '@nestjs/common';
import { PrismaClient, Project } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ProjectService {
  async all(): Promise<Project[]> {
    return prisma.project.findMany();
  }

  async create(id: string, name: string, teamId: string): Promise<Project> {
    return prisma.project.create({
      data: {
        id,
        name,
        teamId,
      },
    });
  }

  async remove(id: string): Promise<Project> {
    return prisma.project.delete({
      where: {
        id,
      },
    });
  }

  async update(id: string, name: string, teamId: string): Promise<Project> {
    return prisma.project.update({
      where: {
        id,
      },
      data: {
        name,
        teamId,
      },
    });
  }
}
