import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Issue, Label } from '@prisma/client';
import { IssueWebhookData } from '../webhook/webhook.service';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class IssueService {
  constructor(
    @InjectPinoLogger(IssueService.name) private readonly logger: PinoLogger,
    private prisma: PrismaService,
  ) {}

  async all(): Promise<Issue[]> {
    this.logger.debug('Fetching all issues');
    return this.prisma.issue.findMany({
      include: {
        labels: true,
      },
    });
  }

  async findById(id: string): Promise<(Issue & { labels: Label[] }) | null> {
    this.logger.debug({ issueId: id }, 'Fetching issue by ID');
    return this.prisma.issue.findUnique({
      where: { id },
      include: {
        labels: true,
      },
    });
  }

  async create(data: IssueWebhookData): Promise<Issue> {
    this.logger.debug({ issueId: data.id }, 'Attempting to create issue');
    try {
      if (!data.projectId) {
        this.logger.warn(
          { issueId: data.id },
          'Cannot create issue: Missing projectId',
        );
        throw new BadRequestException(
          'ProjectId is required to create an issue',
        );
      }

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

      if (data.team?.id) {
        createData.teamKey = data.team.id;
      }

      const createdIssue = await this.prisma.issue.create({
        data: createData,
      });
      this.logger.info(
        { issueId: createdIssue.id, projectId: createdIssue.projectId },
        'Successfully created issue',
      );
      return createdIssue;
    } catch (error) {
      this.logger.error(
        { err: error, issueData: data },
        'Error creating issue',
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to create issue: ${error.message}`,
      );
    }
  }

  async update(id: string, data: IssueWebhookData): Promise<Issue> {
    this.logger.debug({ issueId: id }, 'Attempting to update issue');
    try {
      const existingIssue = await this.prisma.issue.findUnique({
        where: { id },
        select: { id: true },
      });

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

      if (data.projectId) {
        updateData.projectId = data.projectId;
      }

      if (data.team?.id) {
        updateData.teamKey = data.team.id;
      } else {
        updateData.teamKey = null;
      }

      if (existingIssue) {
        const updatedIssue = await this.prisma.issue.update({
          where: { id },
          data: updateData,
        });

        this.logger.info(
          { issueId: updatedIssue.id },
          'Successfully updated existing issue',
        );
        return updatedIssue;
      } else {
        this.logger.info(
          { issueId: id },
          'Issue not found for update, attempting to create instead.',
        );
        return this.create(data);
      }
    } catch (error) {
      this.logger.error(
        { err: error, issueId: id, issueData: data },
        'Error updating issue',
      );
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update issue ${id}: ${error.message}`,
      );
    }
  }

  async createLabelForIssue(
    webhookLabel: NonNullable<IssueWebhookData['labels']>[number],
    issueId: string,
  ): Promise<void> {
    if (!webhookLabel) return;
    await this.prisma.label.create({
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
    await this.prisma.$transaction(async (prisma) => {
      const currentLabels = await prisma.label.findMany({
        where: { issueId },
      });

      const currentLabelIds = currentLabels.map((label) => label.id);
      const removedLabelIds = currentLabelIds.filter(
        (id) => !webhookLabels?.some((label) => label.id === id),
      );

      await this.prisma.label.deleteMany({
        where: {
          issueId,
          id: { in: removedLabelIds },
        },
      });

      if (webhookLabels) {
        for (const webhookLabel of webhookLabels) {
          const existingLabel = currentLabels.find(
            (label) => label.id === webhookLabel.id,
          );

          if (existingLabel) {
            await this.prisma.label.update({
              where: { internalId: existingLabel.internalId },
              data: {
                color: webhookLabel.color,
                name: webhookLabel.name,
              },
            });
          } else {
            await this.createLabelForIssue(webhookLabel, issueId);
          }
        }
      }
    });
  }

  async remove(id: string): Promise<void> {
    this.logger.info({ issueId: id }, 'Removing issue');
    try {
      await this.prisma.issue.delete({ where: { id } });
      this.logger.info({ issueId: id }, 'Successfully removed issue');
    } catch (error) {
      this.logger.error({ err: error, issueId: id }, 'Error removing issue');
      throw new InternalServerErrorException(
        `Failed to remove issue ${id}: ${error.message}`,
      );
    }
  }
}
