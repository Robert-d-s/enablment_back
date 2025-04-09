import { Injectable, Logger } from '@nestjs/common';
import { IssueWebhookData, LinearWebhookBody } from './webhook.service';
import { IssueService } from '../issue/issue.service';
import { PrismaClient } from '@prisma/client';
import { IssueUpdatesGateway } from '../issue-updates/issue-updates.gateway';

const prisma = new PrismaClient();

@Injectable()
export class WebhookIssueService {
  private readonly logger = new Logger(WebhookIssueService.name);
  constructor(
    private issueService: IssueService,
    private readonly issueUpdatesGateway: IssueUpdatesGateway,
  ) {}

  async handleIssue(json: LinearWebhookBody) {
    if (json.type !== 'Issue') {
      console.error('Expected issue data, received:', json.type);
      return;
    }

    const issueData = json.data as IssueWebhookData;

    try {
      switch (json.action) {
        case 'create':
          console.log(`Processing issue create webhook for: ${issueData.id}`);

          const hasProjectForCreate = await this.ensureProjectId(issueData);
          if (!hasProjectForCreate) {
            console.warn(
              `Cannot create issue ${issueData.id}: No suitable project found`,
            );
            return;
          }

          await prisma.$transaction(async (tx) => {
            const createdIssue = await this.createIssue(issueData);

            // Also update labels for newly created issue
            if (issueData.labels && issueData.labels.length > 0) {
              await this.issueService.updateLabelsForIssue(
                issueData.id,
                issueData.labels,
              );
            }

            this.issueUpdatesGateway.broadcastIssueUpdate(createdIssue);
          });

          break;

        case 'update':
          console.log(`Processing issue update webhook for: ${issueData.id}`);

          await prisma.$transaction(async (tx) => {
            // Check if the issue exists before trying to update
            const existingIssue = await prisma.issue.findUnique({
              where: { id: issueData.id },
              select: { id: true },
            });

            if (existingIssue) {
              // If issue exists, we can update it even without a projectId
              await this.updateExistingIssue(issueData);

              // Then update its labels if present
              if (issueData.labels) {
                await this.issueService.updateLabelsForIssue(
                  issueData.id,
                  issueData.labels,
                );
              }
            } else {
              // Issue doesn't exist, need projectId for creation
              const hasProjectForUpdate = await this.ensureProjectId(issueData);
              if (!hasProjectForUpdate) {
                console.warn(
                  `Cannot create non-existent issue ${issueData.id} via update: Missing projectId and no suitable default found`,
                );
                return; // Skip further processing
              }

              await this.createIssue(issueData);

              if (issueData.labels && issueData.labels.length > 0) {
                await this.issueService.updateLabelsForIssue(
                  issueData.id,
                  issueData.labels,
                );
              }
            }

            const updatedIssue = await this.updateExistingIssue(issueData);
            this.issueUpdatesGateway.broadcastIssueUpdate(updatedIssue);
          });
          break;

        case 'remove':
          console.log(`Processing issue remove webhook for: ${issueData.id}`);

          await prisma.$transaction(async (tx) => {
            await this.issueService.remove(issueData.id);

            this.issueUpdatesGateway.broadcastIssueUpdate({
              id: issueData.id,
              action: 'remove',
            }); // Broadcast remove event, send minimal info
          });
          break;

        default:
          console.log('Unhandled webhook action:', json.action);
      }
    } catch (error) {
      if (error.message.includes('Missing projectId')) {
        console.warn(
          `Could not process issue ${issueData.id}: Missing projectId. This might be a standalone issue not connected to any project.`,
        );
      } else {
        console.error(
          `Error processing webhook for issue ${issueData.id}:`,
          error.message,
        );
      }
    }
  }

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
          const teamProject = await prisma.project.findFirst({
            where: { teamId: data.team.id },
            select: { id: true, name: true },
            orderBy: { createdAt: 'desc' },
          });

          if (teamProject) {
            console.log(
              `Using team's project: ${teamProject.name} (${teamProject.id}) for issue ${data.id}`,
            );
            data.projectId = teamProject.id;
            data.projectName = teamProject.name;
            return true;
          }
        }

        // Second attempt: Try to find any available project
        const anyProject = await prisma.project.findFirst({
          select: { id: true, name: true },
          orderBy: { createdAt: 'desc' },
        });

        if (anyProject) {
          console.log(
            `Using default project: ${anyProject.name} (${anyProject.id}) for issue ${data.id}`,
          );
          data.projectId = anyProject.id;
          data.projectName = anyProject.name;
          return true;
        }

        const unassignedProject = await this.createOrGetUnassignedProject();
        if (unassignedProject) {
          console.log(`Using "Unassigned" project for issue ${data.id}`);
          data.projectId = unassignedProject.id;
          data.projectName = unassignedProject.name;
          return true;
        }

        // If we reach here, we couldn't find or create a suitable project
        console.warn(`Could not find any project for issue ${data.id}`);
        return false;
      } catch (error) {
        console.error(`Error finding default project: ${error.message}`);
        return false;
      }
    }

    return true;
  }

  // Helper method to create or get an "Unassigned" project
  private async createOrGetUnassignedProject() {
    const UNASSIGNED_PROJECT_ID = 'unassigned-project-id'; // Use a fixed ID

    try {
      // Try to find existing unassigned project
      const existingProject = await prisma.project.findUnique({
        where: { id: UNASSIGNED_PROJECT_ID },
      });

      if (existingProject) {
        return existingProject;
      }

      // Create unassigned project if it doesn't exist
      return await prisma.$transaction(async (tx) => {
        // First need to make sure there's at least one team
        const team = await tx.team.findFirst();
        if (!team) {
          console.error('Cannot create unassigned project: No teams exist');
          return null;
        }

        // Create the project
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
      console.error(`Error creating unassigned project: ${error.message}`);
      return null;
    }
  }

  private async createIssue(data: IssueWebhookData) {
    try {
      // Ensure we have a projectId
      if (!this.ensureProjectId(data)) {
        throw new Error(
          `Issue ${data.id} has no projectId and no default project is available`,
        );
      }

      return await this.issueService.create(data);
    } catch (error) {
      console.error(`Failed to create issue ${data.id}:`, error.message);
      throw error;
    }
  }

  private async updateExistingIssue(data: IssueWebhookData) {
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
      await prisma.issue.update({
        where: { id: data.id },
        data: updateData,
      });

      return { id: data.id };
    } catch (error) {
      console.error(
        `Failed to update existing issue ${data.id}:`,
        error.message,
      );
      throw error;
    }
  }
}
