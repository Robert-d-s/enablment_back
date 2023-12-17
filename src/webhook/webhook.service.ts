import { Injectable } from '@nestjs/common';
import { WebhookProjectService } from './webhook.project.service';
import { WebhookIssueService } from './webhook.issue.service';
import { TeamService } from '../team/team.service';
import { LinearService } from '../team/linear.service';

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
};

export type LinearWebhookBody = {
  action: 'create' | 'remove' | 'update';
  data: ProjectWebhookData | IssueWebhookData;
  type: 'Project' | 'Issue';
};

@Injectable()
export class WebhookService {
  constructor(
    private webhookProjectService: WebhookProjectService,
    private webhookIssueService: WebhookIssueService,
    private teamService: TeamService,
    private linearService: LinearService,
  ) {}

  async handle(json: LinearWebhookBody) {
    // console.log('Received webhook:', json);
    if (json.type == 'Project') {
      const projectData = json.data as ProjectWebhookData;
      const teamId = projectData.teamIds[0];
      // Check if the team associated with the project exists
      const team = await this.teamService.getTeamById(teamId);
      if (!team) {
        // Synchronize teams using the LinearService
        console.log('Team not found. Synchronizing teams from Linear.');
        await this.linearService.synchronizeTeamsWithLinear();

        // Re-check if the team is now present after synchronization
        const synchronizedTeam = await this.teamService.getTeamById(teamId);
        if (!synchronizedTeam) {
          console.error(
            'Team still not found after synchronization. Cannot process project.',
          );
          return;
        }
      }
      await this.webhookProjectService.handleProject(json);
    } else if (json.type === 'Issue') {
      // console.log('Handling issue data from webhook:', json.data);
      await this.webhookIssueService.handleIssue(json);
    }
  }
}
