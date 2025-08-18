import { Injectable } from '@nestjs/common';
import { WebhookProjectService } from './webhook.project.service';
import { WebhookIssueService } from './webhook.issue.service';
import { TeamService } from '../team/team.service';
import { DatabaseSyncService } from '../dbSynch/dbSynch.service';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

export type ProjectWebhookData = {
  id: string;
  name: string;
  teamIds: string[];
  createdAt: string;
  updatedAt: string;
  description: string;
  state: string;
  startDate: string;
  targetDate: string;
};

export type IssueWebhookData = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  dueDate: string;
  projectId: string;
  priorityLabel: string;
  identifier: string;
  assignee?: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  };
  state?: {
    id: string;
    color: string;
    name: string;
    type: string;
  };
  team?: {
    id: string;
    key: string;
    name: string;
  };
  labels?: Array<{ id: string; name: string; color: string; parentId: string }>;
  projectName?: string;
};

export type LinearWebhookBody = {
  action: 'create' | 'remove' | 'update';
  data: ProjectWebhookData | IssueWebhookData;
  type: 'Project' | 'Issue';
};

@Injectable()
export class WebhookService {
  constructor(
    @InjectPinoLogger(WebhookService.name) private readonly logger: PinoLogger,
    private webhookProjectService: WebhookProjectService,
    private webhookIssueService: WebhookIssueService,
    private teamService: TeamService,
    private databaseSyncService: DatabaseSyncService,
  ) {}

  async handle(json: LinearWebhookBody) {
    const type = json.type;
    const action = json.action;
    const dataId = json.data.id;
    this.logger.info({ type, action, dataId }, 'Received webhook event');
    try {
      if (type == 'Project') {
        const projectData = json.data as ProjectWebhookData;
        const teamId = projectData.teamIds[0];
        this.logger.debug(
          { teamId, projectId: dataId },
          'Checking team existence for project webhook',
        );
        const team = await this.teamService.getTeamById(teamId);

        if (!team) {
          this.logger.info(
            { teamId },
            'Team not found for project webhook. Triggering team synchronization.',
          );
          try {
            await this.databaseSyncService.synchronizeTeamsOnly();
            const synchronizedTeam = await this.teamService.getTeamById(teamId);
            if (!synchronizedTeam) {
              this.logger.error(
                { teamId, projectId: dataId },
                'Team still not found after synchronization. Cannot process project webhook.',
              );
              return;
            }
            this.logger.info(
              { teamId },
              'Team synchronization complete, proceeding with project webhook.',
            );
          } catch (syncError) {
            this.logger.error(
              { err: syncError, teamId },
              'Error during team synchronization triggered by webhook',
            );
            return;
          }
        }
        await this.webhookProjectService.handleProject(json);
      } else if (type === 'Issue') {
        await this.webhookIssueService.handleIssue(json);
      } else {
        this.logger.warn({ type }, 'Received webhook for unhandled type');
      }
      this.logger.info({ type, action, dataId }, 'Webhook processing complete');
    } catch (error) {
      this.logger.error(
        { err: error, type, action, dataId },
        'Unhandled error during webhook processing',
      );
    }
  }
}
