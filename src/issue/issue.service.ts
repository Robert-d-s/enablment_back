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

  async createLabelForIssue(
    webhookLabel: IssueWebhookData['labels'][number],
    issueId: string,
  ): Promise<void> {
    await prisma.label.create({
      data: {
        id: webhookLabel.id,
        issueId,
        color: webhookLabel.color,
        name: webhookLabel.name,
        parentId: webhookLabel.parentId,
      },
    });
  }
  async updateLabelsForIssue(
    issueId: string,
    webhookLabels: IssueWebhookData['labels'],
  ): Promise<void> {
    await prisma.$transaction(async (prisma) => {
      // Get all labels connected to this issue
      const currentLabels = await prisma.label.findMany({
        where: { issueId },
      });

      // Process removed labels
      const currentLabelIds = currentLabels.map((label) => label.id);
      const removedLabelIds = currentLabelIds.filter(
        (id) => !webhookLabels.some((label) => label.id === id),
      );

      await prisma.label.deleteMany({
        where: {
          issueId,
          id: { in: removedLabelIds },
        },
      });

      // Process existing and new labels
      for (const webhookLabel of webhookLabels) {
        const existingLabel = currentLabels.find(
          (label) => label.id === webhookLabel.id,
        );

        if (existingLabel) {
          // Update existing label
          await prisma.label.update({
            where: { internalId: existingLabel.internalId },
            data: {
              color: webhookLabel.color,
              name: webhookLabel.name,
              // ... other fields you might need to update
            },
          });
        } else {
          // Create new label
          await this.createLabelForIssue(webhookLabel, issueId);
        }
      }
    });
  }

  // private async createOrUpdateLabel(
  //   label: IssueWebhookData['labels'][number],
  //   issueId: string,
  // ): Promise<void> {
  //   const existingLabel = await prisma.label.findUnique({
  //     where: { id: label.id },
  //   });

  //   if (existingLabel) {
  //     await prisma.label.update({
  //       where: { id: label.id },
  //       data: {
  //         name: label.name,
  //         color: label.color,
  //         parentId: label.parentId,
  //         issue: {
  //           connect: { id: issueId },
  //         },
  //       },
  //     });
  //   } else {
  //     await prisma.label.create({
  //       data: {
  //         id: label.id,
  //         name: label.name,
  //         color: label.color,
  //         parentId: label.parentId,
  //         issue: {
  //           connect: { id: issueId },
  //         },
  //       },
  //     });
  //   }
  // }

  async remove(id: string): Promise<void> {
    await prisma.issue.delete({
      where: { id },
    });
  }

  // This method will check if an issue exists and create it if not
  async ensureIssueExists(
    issueId: string,
    data: IssueWebhookData,
  ): Promise<Issue> {
    let issue = await prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      // If the issue does not exist, create it using the existing 'create' method
      issue = await this.create(data);
    } else {
      await this.update(issueId, data);
    }

    return issue;
  }
}
