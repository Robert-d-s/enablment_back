import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Project } from '@prisma/client';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async all(): Promise<Project[]> {
    return this.prisma.project.findMany();
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
