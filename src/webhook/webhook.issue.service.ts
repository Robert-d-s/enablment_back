import { Injectable } from '@nestjs/common';
import { IssueWebhookData, LinearWebhookBody } from './webhook.service';
import { IssueService } from '../issue/issue.service';
import { IssueUpdatesGateway } from '../issue-updates/issue-updates.gateway';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhookIssueService {
  constructor(
    @InjectPinoLogger(WebhookIssueService.name)
    private readonly logger: PinoLogger,
    private issueService: IssueService,
    private readonly issueUpdatesGateway: IssueUpdatesGateway,
    private readonly prisma: PrismaService,
  ) {}

  async handleIssue(json: LinearWebhookBody) {
    if (json.type !== 'Issue') {
      this.logger.error(
        { type: json.type },
        'Expected issue data, received different type',
      );
      return;
    }

    const issueData = json.data as IssueWebhookData;
    const action = json.action;
    this.logger.info(
      { issueId: issueData.id, action },
      'Processing issue webhook',
    );

    try {
      switch (action) {
        case 'create':
          this.logger.debug(
            { issueId: issueData.id },
            'Handling "create" action',
          );

          const hasProjectForCreate = await this.ensureProjectId(issueData);
          if (!hasProjectForCreate) {
            this.logger.warn(
              { issueId: issueData.id },
              'Cannot create issue: No suitable project found',
            );
            return;
          }

          // Create the issue first
          const createdIssue = await this.createIssue(issueData);

          // Then update labels if present
          if (issueData.labels && issueData.labels.length > 0) {
            await this.issueService.updateLabelsForIssue(
              issueData.id,
              issueData.labels,
            );
          }

          // Fetch the complete issue with labels
          const completeIssue = await this.issueService.findById(issueData.id);
          if (completeIssue) {
            // Broadcast the complete issue with the action field
            this.issueUpdatesGateway.broadcastIssueUpdate({
              ...completeIssue,
              action: 'create',
            });
          } else {
            // Fallback if complete issue can't be fetched
            this.logger.warn(
              { issueId: issueData.id },
              'Could not fetch complete issue after creation for broadcast',
            );
            this.issueUpdatesGateway.broadcastIssueUpdate({
              ...createdIssue,
              labels: issueData.labels || [],
              action: 'create',
            });
          }
          break;

        case 'update':
          this.logger.debug(
            { issueId: issueData.id },
            'Handling "update" action',
          );

          await this.prisma.$transaction(async () => {
            // Check if the issue exists before trying to update
            const existingIssue = await this.prisma.issue.findUnique({
              where: { id: issueData.id },
              select: { id: true },
            });

            if (existingIssue) {
              // If issue exists, update it first
              await this.updateExistingIssue(issueData);

              // Then update its labels if present
              if (issueData.labels) {
                await this.issueService.updateLabelsForIssue(
                  issueData.id,
                  issueData.labels,
                );
              }

              // Fetch the complete updated issue with labels
              const completeIssue = await this.issueService.findById(
                issueData.id,
              );

              // Log the labels to verify they're included
              this.logger.trace(
                { issueId: issueData.id, labels: completeIssue?.labels },
                'Issue updated with labels, preparing broadcast',
              );
              // console.log(
              //   `Issue ${issueData.id} updated with labels:`,
              //   completeIssue && 'labels' in completeIssue
              //     ? completeIssue.labels
              //     : issueData.labels || 'No labels',
              // );

              // Broadcast the complete issue with the action field
              if (completeIssue) {
                this.issueUpdatesGateway.broadcastIssueUpdate({
                  ...completeIssue,
                  action: 'update',
                });
              } else {
                // Fallback if complete issue can't be fetched
                const basicUpdatedIssue =
                  await this.updateExistingIssue(issueData);
                this.issueUpdatesGateway.broadcastIssueUpdate({
                  ...basicUpdatedIssue,
                  labels: issueData.labels || [],
                  action: 'update',
                });
              }
            } else {
              // Issue doesn't exist, need projectId for creation
              const hasProjectForUpdate = await this.ensureProjectId(issueData);
              if (!hasProjectForUpdate) {
                this.logger.warn(
                  { issueId: issueData.id },
                  'Cannot create non-existent issue via update: Missing projectId/default',
                );
                return; // Skip further processing
              }

              // Create the issue
              await this.createIssue(issueData);

              // Update labels if present
              if (issueData.labels && issueData.labels.length > 0) {
                await this.issueService.updateLabelsForIssue(
                  issueData.id,
                  issueData.labels,
                );
              }

              // Fetch the complete issue with labels
              const completeIssue = await this.issueService.findById(
                issueData.id,
              );

              // Broadcast the complete issue with the action field
              if (completeIssue) {
                this.issueUpdatesGateway.broadcastIssueUpdate({
                  ...completeIssue,
                  action: 'create', // It's a creation via update
                });
              } else {
                // Fallback if complete issue can't be fetched
                this.issueUpdatesGateway.broadcastIssueUpdate({
                  id: issueData.id,
                  title: issueData.title,
                  labels: issueData.labels || [],
                  action: 'create',
                });
              }
            }
          });
          break;

        case 'remove':
          this.logger.debug(
            { issueId: issueData.id },
            'Handling "remove" action',
          );

          await this.prisma.$transaction(async () => {
            await this.issueService.remove(issueData.id);

            // For removals, just send the ID and action
            this.issueUpdatesGateway.broadcastIssueUpdate({
              id: issueData.id,
              action: 'remove',
            });
          });
          break;

        default:
          this.logger.warn({ action: json.action }, 'Unhandled webhook action');
      }
    } catch (error) {
      if (error.message && error.message.includes('Missing projectId')) {
        this.logger.warn(
          { err: error, issueId: issueData.id },
          'Could not process issue webhook due to missing projectId',
        );
      } else {
        this.logger.error(
          { err: error, issueId: issueData.id, action },
          'Error processing issue webhook',
        );
      }
    }
  }

  /**
   * Ensures the issue has a valid projectId, either from the payload or by finding a suitable default
   */
  private async ensureProjectId(data: IssueWebhookData): Promise<boolean> {
    // Try to get projectId from project.id if projectId is missing
    if (!data.projectId && data.project?.id) {
      data.projectId = data.project.id;
      return true;
    }

    // If still no projectId, try to find a default project
    if (!data.projectId) {
      try {
        // First attempt: Try to find a project associated with the team if available
        if (data.team?.id) {
          const teamProject = await this.prisma.project.findFirst({
            where: { teamId: data.team.id },
            select: { id: true, name: true },
            orderBy: { createdAt: 'desc' },
          });

          if (teamProject) {
            this.logger.debug(
              { projectId: teamProject.id, issueId: data.id },
              "Using team's project for issue",
            );
            data.projectId = teamProject.id;
            data.projectName = teamProject.name;
            return true;
          }
        }

        // Second attempt: Try to find any available project
        const anyProject = await this.prisma.project.findFirst({
          select: { id: true, name: true },
          orderBy: { createdAt: 'desc' },
        });

        if (anyProject) {
          this.logger.debug(
            { projectId: anyProject.id, issueId: data.id },
            'Using default project for issue',
          );
          data.projectId = anyProject.id;
          data.projectName = anyProject.name;
          return true;
        }

        // Last resort: Create or get a special "Unassigned" project
        const unassignedProject = await this.createOrGetUnassignedProject();
        if (unassignedProject) {
          this.logger.debug(
            { projectId: unassignedProject.id, issueId: data.id },
            'Using "Unassigned" project for issue',
          );
          data.projectId = unassignedProject.id;
          data.projectName = unassignedProject.name;
          return true;
        }

        // If we reach here, we couldn't find or create a suitable project
        this.logger.warn(
          { issueId: data.id },
          'Could not find any project for issue',
        );
        return false;
      } catch (error) {
        this.logger.error(
          { err: error, issueId: data.id },
          'Error finding default project',
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Creates or retrieves a special "Unassigned" project for issues without a project
   */
  private async createOrGetUnassignedProject() {
    const UNASSIGNED_PROJECT_ID = 'unassigned-project-id'; // Use a fixed ID

    try {
      // Try to find existing unassigned project
      const existingProject = await this.prisma.project.findUnique({
        where: { id: UNASSIGNED_PROJECT_ID },
      });

      if (existingProject) {
        return existingProject;
      }

      // Create unassigned project if it doesn't exist
      return await this.prisma.$transaction(async (tx) => {
        // First need to make sure there's at least one team
        const team = await tx.team.findFirst();
        if (!team) {
          this.logger.error('Cannot create unassigned project: No teams exist');
          return null;
        }

        // Create the project
        this.logger.info('Creating "Unassigned" project');
        return await tx.project.create({
          data: {
            id: UNASSIGNED_PROJECT_ID,
            name: 'Unassigned',
            teamId: team.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            state: 'Unassigned',
            description: 'Automatically created for issues without projects',
          },
        });
      });
    } catch (error) {
      this.logger.error(
        { err: error },
        'Error creating or getting unassigned project',
      );
      return null;
    }
  }

  /**
   * Creates a new issue in the database
   */
  private async createIssue(data: IssueWebhookData) {
    this.logger.debug({ issueId: data.id }, 'Calling issueService.create');
    try {
      // Ensure we have a projectId
      if (!(await this.ensureProjectId(data))) {
        throw new Error(
          `Issue ${data.id} has no projectId and no default project is available`,
        );
      }

      return await this.issueService.create(data);
    } catch (error) {
      this.logger.error(
        { err: error, issueId: data.id },
        'Failed to create issue in createIssue helper',
      );
      throw error;
    }
  }

  /**
   * Updates an existing issue in the database
   */
  private async updateExistingIssue(data: IssueWebhookData) {
    this.logger.debug({ issueId: data.id }, 'Updating existing issue data');
    try {
      const updateData: any = {
        updatedAt: data.updatedAt,
        title: data.title,
        dueDate: data.dueDate,
        priorityLabel: data.priorityLabel || 'No Priority',
        identifier: data.identifier,
        assigneeName: data.assignee?.name || 'No Assignee',
        state: data.state?.name,
        teamName: data.team?.name,
      };

      // Only include projectName and projectId if they exist
      if (data.project?.name) {
        updateData.projectName = data.project.name;
      }

      if (data.projectId) {
        updateData.projectId = data.projectId;
      }

      // Handle team relationship
      if (data.team?.id) {
        updateData.teamKey = data.team.id;
      }

      // Update the issue directly using prisma to avoid the create fallback
      await this.prisma.issue.update({
        where: { id: data.id },
        data: updateData,
      });
      this.logger.debug(
        { issueId: data.id },
        'Prisma update successful for existing issue',
      );
      return {
        id: data.id,
        title: data.title,
        state: data.state?.name,
        teamName: data.team?.name,
        assigneeName: data.assignee?.name || 'No Assignee',
        priorityLabel: data.priorityLabel || 'No Priority',
        labels: data.labels || [],
      };
    } catch (error) {
      this.logger.error(
        { err: error, issueId: data.id },
        'Failed to update existing issue',
      );
      throw error;
    }
  }
}
