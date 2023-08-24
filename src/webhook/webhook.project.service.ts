import { Injectable } from '@nestjs/common';
import { LinearWebhookBody } from './webhook.service';
import { ProjectService } from 'src/project/project.service';

@Injectable()
export class WebhookProjectService {
  constructor(private projectService: ProjectService) {}

  async handleProject(json: LinearWebhookBody) {
    switch (json.action) {
      case 'create':
        await this.create(json.data);
        break;
      case 'remove':
        await this.remove(json.data);
        break;
      case 'update':
        break;
      default:
        console.log('UNMATCHED WEBHOOK FROM LINEAR');
        break;
    }
  }

  async create(json: LinearWebhookBody['data']) {
    await this.projectService.create(json.id, json.name, json.teamIds[0]);
  }

  async remove(json: LinearWebhookBody['data']) {
    await this.projectService.remove(json.id);
  }

  async update(json: LinearWebhookBody['data']) {
    await this.projectService.update(json.id, json.name, json.teamIds[0]);
  }
}
