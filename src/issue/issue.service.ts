import { Injectable } from '@nestjs/common';
import { PrismaClient, Issue } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class IssueService {
  async all(): Promise<Issue[]> {
    return prisma.issue.findMany();
  }

  async create(data: {
    id: string;
    createdAt: string;
    updatedAt: string;
    title: string;
    dueDate: string;
    projectId: string;
    priorityLabel: string;
    identifier: string;
    assigneeName: string;
    projectName: string;
    state: string;
    teamKey: string;
    teamName: string;
  }): Promise<Issue> {
    return prisma.issue.create({ data });
  }

  async remove(id: string): Promise<Issue> {
    return prisma.issue.delete({
      where: {
        id,
      },
    });
  }

  async update(
    id: string,
    updateData: {
      // id: string,
      createdAt: string;
      updatedAt: string;
      title: string;
      dueDate: string;
      projectId: string;
      priorityLabel: string;
      identifier: string;
      assigneeName: string;
      projectName: string;
      state: string;
      teamKey: string;
      teamName: string;
    },
  ): Promise<Issue> {
    return prisma.issue.update({
      where: { id },
      data: updateData,
    });
  }
}
