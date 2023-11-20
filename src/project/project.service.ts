import { Injectable } from '@nestjs/common';
import { PrismaClient, Project } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ProjectService {
  async all(): Promise<Project[]> {
    return prisma.project.findMany();
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
    return prisma.project.create({
      data: {
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

  async remove(id: string): Promise<Project> {
    return prisma.project.delete({
      where: {
        id,
      },
    });
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
    return prisma.project.upsert({
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
