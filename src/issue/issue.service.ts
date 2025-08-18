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
import { CreateIssueData, UpdateIssueData } from './dto/issue-data.dto';
import { ISSUE_CONSTANTS } from './constants/issue.constants';
import { IssueValidationService } from './utils/issue-validation.service';
import { IssueCacheService } from './services/issue-cache.service';

@Injectable()
export class IssueService {
  constructor(
    @InjectPinoLogger(IssueService.name) private readonly logger: PinoLogger,
    private prisma: PrismaService,
    private cacheService: IssueCacheService,
  ) {}

  async all(
    page: number = 1,
    limit: number = 50,
  ): Promise<{ issues: Issue[]; total: number; hasNext: boolean }> {
    this.logger.debug({ page, limit }, 'Fetching paginated issues');

    // Check cache first
    const cached = this.cacheService.getCachedPaginatedIssues(page, limit);
    if (cached) {
      this.logger.debug({ page, limit }, 'Returning cached paginated issues');
      return cached;
    }

    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100); // Cap at 100 items per page

    const [issues, total] = await Promise.all([
      this.prisma.issue.findMany({
        skip,
        take,
        include: {
          labels: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),
      this.prisma.issue.count(),
    ]);

    const hasNext = skip + take < total;

    const result = {
      issues,
      total,
      hasNext,
    };

    // Cache the result
    this.cacheService.cachePaginatedIssues(page, limit, result);

    return result;
  }

  async findById(id: string): Promise<(Issue & { labels: Label[] }) | null> {
    this.logger.debug({ issueId: id }, 'Fetching issue by ID');

    // Check cache first
    const cached = this.cacheService.getCachedIssue(id);
    if (cached) {
      this.logger.debug({ issueId: id }, 'Returning cached issue');
      return cached;
    }

    const issue = await this.prisma.issue.findUnique({
      where: { id },
      include: {
        labels: true,
      },
    });

    // Cache the result if found
    if (issue) {
      this.cacheService.cacheIssue(issue);
    }

    return issue;
  }

  async create(data: IssueWebhookData): Promise<Issue> {
    this.logger.debug({ issueId: data.id }, 'Attempting to create issue');
    try {
      // Validate input data
      IssueValidationService.validateCreateData(data);

      const createData: CreateIssueData = {
        id: data.id,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        title: data.title,
        dueDate: data.dueDate,
        priorityLabel:
          data.priorityLabel || ISSUE_CONSTANTS.DEFAULT_VALUES.PRIORITY,
        identifier: data.identifier,
        assigneeName:
          data.assignee?.name || ISSUE_CONSTANTS.DEFAULT_VALUES.ASSIGNEE,
        projectName:
          data.project?.name || ISSUE_CONSTANTS.DEFAULT_VALUES.PROJECT_NAME,
        state: data.state?.name || 'Backlog',
        teamName: data.team?.name,
        projectId: data.projectId,
      };

      if (data.team?.id) {
        createData.teamKey = data.team.id;
      }

      const createdIssue = await this.prisma.issue.create({
        data: createData,
      });

      // Cache the created issue and invalidate pagination cache
      this.cacheService.cacheIssue({ ...createdIssue, labels: [] });
      this.cacheService.clearPaginationCache();

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
      // Validate input data for updates
      IssueValidationService.validateUpdateData(data);

      return await this.prisma.$transaction(async (prisma) => {
        const existingIssue = await prisma.issue.findUnique({
          where: { id },
          select: { id: true },
        });

        const updateData: UpdateIssueData = {
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          title: data.title,
          dueDate: data.dueDate,
          priorityLabel:
            data.priorityLabel || ISSUE_CONSTANTS.DEFAULT_VALUES.PRIORITY,
          identifier: data.identifier,
          assigneeName:
            data.assignee?.name || ISSUE_CONSTANTS.DEFAULT_VALUES.ASSIGNEE,
          projectName:
            data.project?.name || ISSUE_CONSTANTS.DEFAULT_VALUES.PROJECT_NAME,
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
          const updatedIssue = await prisma.issue.update({
            where: { id },
            data: updateData,
          });

          // Update cache and invalidate pagination cache
          this.cacheService.cacheIssue({ ...updatedIssue, labels: [] });
          this.cacheService.clearPaginationCache();

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
      });
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

      const currentLabelIds = new Set(currentLabels.map((label) => label.id));
      const webhookLabelIds = new Set(
        webhookLabels?.map((label) => label.id) || [],
      );

      // Find labels to remove
      const removedLabelIds = Array.from(currentLabelIds).filter(
        (id) => !webhookLabelIds.has(id),
      );

      // Batch delete removed labels
      if (removedLabelIds.length > 0) {
        await this.prisma.label.deleteMany({
          where: {
            issueId,
            id: { in: removedLabelIds },
          },
        });
      }

      if (webhookLabels && webhookLabels.length > 0) {
        // Separate labels into updates and creates
        const labelsToUpdate: Array<{
          internalId: number;
          data: { color: string; name: string };
        }> = [];
        const labelsToCreate: Array<{
          id: string;
          issueId: string;
          color: string;
          name: string;
          parentId?: string;
        }> = [];

        for (const webhookLabel of webhookLabels) {
          const existingLabel = currentLabels.find(
            (label) => label.id === webhookLabel.id,
          );

          if (existingLabel) {
            labelsToUpdate.push({
              internalId: existingLabel.internalId,
              data: {
                color: webhookLabel.color,
                name: webhookLabel.name,
              },
            });
          } else {
            labelsToCreate.push({
              id: webhookLabel.id,
              issueId,
              color: webhookLabel.color,
              name: webhookLabel.name,
              parentId: webhookLabel.parentId,
            });
          }
        }

        // Batch create new labels
        if (labelsToCreate.length > 0) {
          await prisma.label.createMany({
            data: labelsToCreate,
          });
        }

        // Batch update existing labels (unfortunately Prisma doesn't support updateMany with different data)
        // So we'll use Promise.all for parallel updates
        if (labelsToUpdate.length > 0) {
          await Promise.all(
            labelsToUpdate.map((labelUpdate) =>
              prisma.label.update({
                where: { internalId: labelUpdate.internalId },
                data: labelUpdate.data,
              }),
            ),
          );
        }
      }
    });
  }

  async remove(id: string): Promise<void> {
    this.logger.info({ issueId: id }, 'Removing issue');
    try {
      const existingIssue = await this.prisma.issue.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existingIssue) {
        this.logger.warn({ issueId: id }, 'Issue not found for removal');
        throw new NotFoundException(`Issue with ID ${id} not found`);
      }

      await this.prisma.issue.delete({ where: { id } });

      // Invalidate cache
      this.cacheService.invalidateIssue(id);

      this.logger.info({ issueId: id }, 'Successfully removed issue');
    } catch (error) {
      this.logger.error({ err: error, issueId: id }, 'Error removing issue');
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to remove issue ${id}: ${error.message}`,
      );
    }
  }

  // Bulk operations for better performance
  async bulkCreate(issuesData: IssueWebhookData[]): Promise<Issue[]> {
    this.logger.debug(
      { count: issuesData.length },
      'Attempting bulk create of issues',
    );

    try {
      const validatedData = issuesData.map((data) => {
        IssueValidationService.validateCreateData(data);

        const createData: CreateIssueData = {
          id: data.id,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          title: data.title,
          dueDate: data.dueDate,
          priorityLabel:
            data.priorityLabel || ISSUE_CONSTANTS.DEFAULT_VALUES.PRIORITY,
          identifier: data.identifier,
          assigneeName:
            data.assignee?.name || ISSUE_CONSTANTS.DEFAULT_VALUES.ASSIGNEE,
          projectName:
            data.project?.name || ISSUE_CONSTANTS.DEFAULT_VALUES.PROJECT_NAME,
          state: data.state?.name || 'Backlog',
          teamName: data.team?.name,
          projectId: data.projectId,
          teamKey: data.team?.id,
        };

        return createData;
      });

      // Use createMany for better performance, but note it doesn't return created records
      await this.prisma.issue.createMany({
        data: validatedData,
        skipDuplicates: true,
      });

      // Fetch the created issues
      const createdIssues = await this.prisma.issue.findMany({
        where: {
          id: { in: validatedData.map((data) => data.id) },
        },
      });

      this.logger.info(
        { count: createdIssues.length },
        'Successfully bulk created issues',
      );

      return createdIssues;
    } catch (error) {
      this.logger.error(
        { err: error, count: issuesData.length },
        'Error in bulk create issues',
      );
      throw new InternalServerErrorException(
        `Failed to bulk create issues: ${error.message}`,
      );
    }
  }

  async bulkRemove(ids: string[]): Promise<{ count: number }> {
    this.logger.info({ issueIds: ids }, 'Bulk removing issues');

    try {
      const result = await this.prisma.issue.deleteMany({
        where: {
          id: { in: ids },
        },
      });

      this.logger.info(
        { deletedCount: result.count, requestedCount: ids.length },
        'Successfully bulk removed issues',
      );

      return result;
    } catch (error) {
      this.logger.error(
        { err: error, issueIds: ids },
        'Error in bulk remove issues',
      );
      throw new InternalServerErrorException(
        `Failed to bulk remove issues: ${error.message}`,
      );
    }
  }
}
