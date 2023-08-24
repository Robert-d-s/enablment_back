import { Injectable } from '@nestjs/common';
import { WebhookProjectService } from './webhook.project.service';

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
  constructor(private webhookProjectService: WebhookProjectService) {}

  async handle(json: LinearWebhookBody) {
    if (json.type == 'Project') {
      await this.webhookProjectService.handleProject(json);
    }
  }
}
