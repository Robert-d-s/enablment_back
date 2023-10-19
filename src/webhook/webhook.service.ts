import { Injectable } from '@nestjs/common';
import { WebhookProjectService } from './webhook.project.service';
import { TeamService } from '../team/team.service';
import { LinearService } from '../team/linear.service';

export type LinearWebhookBody = {
  type: 'Project';
  action: 'create' | 'remove' | 'update';
  data: {
    id: string;
    name: string;
    teamIds: string[];
  };
};

@Injectable()
export class WebhookService {
  constructor(
    private webhookProjectService: WebhookProjectService,
    private teamService: TeamService,
    private linearService: LinearService,
  ) {}

  async handle(json: LinearWebhookBody) {
    if (json.type == 'Project') {
      // Check if the team associated with the project exists
      const team = await this.teamService.getTeamById(json.data.teamIds[0]);
      if (!team) {
        // Synchronize teams using the LinearService
        console.log('Team not found. Synchronizing teams from Linear.');
        await this.linearService.synchronizeTeamsWithLinear();

        // Re-check if the team is now present after synchronization
        const synchronizedTeam = await this.teamService.getTeamById(
          json.data.teamIds[0],
        );
        if (!synchronizedTeam) {
          console.error(
            'Team still not found after synchronization. Cannot process project.',
          );
          return;
        }
      }
      await this.webhookProjectService.handleProject(json);
    }
  }
}
