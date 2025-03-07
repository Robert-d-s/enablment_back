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
    // Make sure we have a valid projectId
    if (!data.projectId) {
      console.warn(`Cannot create issue ${data.id}: Missing projectId`);
      throw new Error('ProjectId is required to create an issue');
    }

    try {
      const createData: any = {
        id: data.id,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        title: data.title,
        dueDate: data.dueDate,
        priorityLabel: data.priorityLabel || 'No Priority',
        identifier: data.identifier,
        assigneeName: data.assignee?.name || 'No Assignee',
        projectName: data.project?.name || 'Unknown Project',
        state: data.state?.name,
        teamName: data.team?.name,
        projectId: data.projectId,
      };

      // Only set teamKey if team exists and has an id
      if (data.team?.id) {
        createData.teamKey = data.team.id;
      }

      const createdIssue = await prisma.issue.create({
        data: createData,
      });

      return createdIssue;
    } catch (error) {
      console.error('Error creating issue:', error);
      throw error;
    }
  }

  async update(id: string, data: IssueWebhookData): Promise<Issue> {
    try {
      // First check if the issue exists
      const existingIssue = await prisma.issue.findUnique({
        where: { id },
        select: { id: true },
      });

      // Define update data with direct field assignments
      const updateData: any = {
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        title: data.title,
        dueDate: data.dueDate,
        priorityLabel: data.priorityLabel || 'No Priority',
        identifier: data.identifier,
        assigneeName: data.assignee?.name || 'No Assignee',
        projectName: data.project?.name || 'Unknown Project',
        state: data.state?.name,
        teamName: data.team?.name,
      };

      // Only update projectId if it's provided
      if (data.projectId) {
        updateData.projectId = data.projectId;
      }

      // Handle team relationship directly with teamKey field
      if (data.team?.id) {
        updateData.teamKey = data.team.id;
      } else {
        updateData.teamKey = null; // Disconnect if no team
      }

      if (existingIssue) {
        // If issue exists, perform update
        const updatedIssue = await prisma.issue.update({
          where: { id },
          data: updateData,
        });

        console.log(`Updated issue ID: ${updatedIssue.id}`);
        return updatedIssue;
      } else {
        // If issue doesn't exist, create it
        return this.create(data);
      }
    } catch (error) {
      console.error(`Error updating issue ${id}:`, error);
      throw error;
    }
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
            },
          });
        } else {
          // Create new label
          await this.createLabelForIssue(webhookLabel, issueId);
        }
      }
    });
  }

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
