import { Injectable } from '@nestjs/common';
import { ProjectWebhookData, LinearWebhookBody } from './webhook.service';
import { ProjectService } from '../project/project.service';

@Injectable()
export class WebhookProjectService {
  constructor(private projectService: ProjectService) {}

  async handleProject(json: LinearWebhookBody) {
    if (json.type !== 'Project') {
      console.error('Expected project data, received:', json.type);
      return;
    }
    switch (json.action) {
      case 'create':
        await this.create(json.data);
        break;
      case 'remove':
        await this.remove(json.data);
        break;
      case 'update':
        await this.update(json.data);
        break;
      default:
        console.log('UNMATCHED WEBHOOK FROM LINEAR');
        break;
    }
  }

  async create(json: LinearWebhookBody['data']) {
    const projectData = json as ProjectWebhookData;
    await this.projectService.create(
      projectData.id,
      projectData.name,
      projectData.teamIds[0],
      projectData.createdAt,
      projectData.updatedAt,
      projectData.description,
      projectData.state || 'Active',
      projectData.startDate,
      projectData.targetDate,
    );
  }

  async remove(json: LinearWebhookBody['data']) {
    await this.projectService.remove(json.id);
  }

  async update(json: LinearWebhookBody['data']) {
    const projectData = json as ProjectWebhookData;
    await this.projectService.update(
      projectData.id,
      projectData.name,
      projectData.teamIds[0],
      projectData.createdAt,
      projectData.updatedAt,
      projectData.description,
      projectData.state || 'Active',
      projectData.startDate,
      projectData.targetDate,
    );
  }
}
