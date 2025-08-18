import { Injectable } from '@nestjs/common';
import { ProjectWebhookData, LinearWebhookBody } from './webhook.service';
import { ProjectSyncService } from '../project/project-sync.service';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class WebhookProjectService {
  constructor(
    @InjectPinoLogger(WebhookProjectService.name)
    private readonly logger: PinoLogger,
    private projectSyncService: ProjectSyncService,
  ) {}

  async handleProject(json: LinearWebhookBody): Promise<void> {
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

  async create(json: LinearWebhookBody['data']): Promise<void> {
    const projectData = json as ProjectWebhookData;
    await this.projectSyncService.createFromSync({
      id: projectData.id,
      name: projectData.name,
      teamId: projectData.teamIds[0],
      createdAt: projectData.createdAt,
      updatedAt: projectData.updatedAt,
      description: projectData.description,
      state: projectData.state || 'Active',
      startDate: projectData.startDate,
      targetDate: projectData.targetDate,
    });
  }

  async remove(json: LinearWebhookBody['data']): Promise<void> {
    await this.projectSyncService.removeFromSync(json.id);
  }

  async update(json: LinearWebhookBody['data']): Promise<void> {
    const projectData = json as ProjectWebhookData;
    await this.projectSyncService.upsertFromSync({
      id: projectData.id,
      name: projectData.name,
      teamId: projectData.teamIds[0],
      createdAt: projectData.createdAt,
      updatedAt: projectData.updatedAt,
      description: projectData.description,
      state: projectData.state || 'Active',
      startDate: projectData.startDate,
      targetDate: projectData.targetDate,
    });
  }
}
