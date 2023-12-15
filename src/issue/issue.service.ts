import { Injectable } from '@nestjs/common';
import { PrismaClient, Issue } from '@prisma/client';
import { IssueWebhookData } from '../webhook/webhook.service';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

@Injectable()
export class IssueService {
  async all(): Promise<Issue[]> {
    return prisma.issue.findMany({
      include: {
        labels: true,
      },
    });
  }

  async create(data: IssueWebhookData): Promise<Issue> {
    const createdIssue = await prisma.issue.create({
      data: {
        id: data.id,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        title: data.title,
        dueDate: data.dueDate,
        projectId: data.projectId,
        priorityLabel: data.priorityLabel,
        identifier: data.identifier,
        assigneeName: data.assignee?.name || 'No Assignee',
        projectName: data.project?.name,
        state: data.state?.name,
        teamKey: data.team?.key,
        teamName: data.team?.name,
      },
    });
    return createdIssue;
  }

  async update(id: string, data: IssueWebhookData): Promise<Issue> {
    return prisma.issue.upsert({
      where: { id },
      update: {
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        title: data.title,
        dueDate: data.dueDate,
        projectId: data.projectId,
        priorityLabel: data.priorityLabel,
        identifier: data.identifier,
        assigneeName: data.assignee?.name || 'No Assignee',
        projectName: data.project?.name,
        state: data.state?.name,
        teamKey: data.team?.key,
        teamName: data.team?.name,
      },
      create: {
        id,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        title: data.title,
        dueDate: data.dueDate,
        projectId: data.projectId,
        priorityLabel: data.priorityLabel,
        identifier: data.identifier,
        assigneeName: data.assignee?.name || 'No Assignee',
        projectName: data.project?.name,
        state: data.state?.name,
        teamKey: data.team?.key,
        teamName: data.team?.name,
      },
    });
  }

  async updateLabelsForIssue(
    issueId: string,
    labels: IssueWebhookData['labels'],
  ): Promise<void> {
    for (const label of labels) {
      await this.createOrUpdateLabel(label, issueId);
    }

    await prisma.issue.update({
      where: { id: issueId },
      data: {
        labels: {
          connect: labels.map((label) => ({ id: label.id })),
        },
      },
    });
  }

  private async createOrUpdateLabel(
    label: IssueWebhookData['labels'][number],
    issueId: string,
  ): Promise<void> {
    const existingLabel = await prisma.label.findUnique({
      where: { id: label.id },
    });

    if (existingLabel) {
      await prisma.label.update({
        where: { id: label.id },
        data: {
          name: label.name,
          color: label.color,
          parentId: label.parentId,
        },
      });
    } else {
      await prisma.label.create({
        data: {
          id: label.id,
          name: label.name,
          color: label.color,
          parentId: label.parentId,
          issueId,
        },
      });
    }
  }

  async remove(id: string): Promise<void> {
    await prisma.issue.delete({
      where: { id },
    });
  }
}
