import { Injectable } from '@nestjs/common';
import { ProjectWebhookData, LinearWebhookBody } from './webhook.service';
import { ProjectService } from '../project/project.service';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class WebhookProjectService {
  constructor(
    @InjectPinoLogger(WebhookProjectService.name)
    private readonly logger: PinoLogger,
    private projectService: ProjectService,
  ) {}

  async handleProject(json: LinearWebhookBody) {
    if (json.type !== 'Project') {
      this.logger.error(
        { type: json.type },
        'Expected project data, received different type',
      );
      return;
    }
    const action = json.action;
    const projectId = json.data.id;
    this.logger.info({ projectId, action }, 'Handling project webhook');

    try {
      switch (action) {
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
          this.logger.warn(
            { action },
            'Unhandled project webhook action from Linear',
          );
          break;
      }
      this.logger.info(
        { projectId, action },
        'Successfully handled project webhook',
      );
    } catch (error) {
      this.logger.error(
        { err: error, projectId, action },
        'Error handling project webhook',
      );
      throw error;
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
