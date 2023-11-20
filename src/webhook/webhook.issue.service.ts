// src/issue/webhook.issue.service.ts

import { Injectable } from '@nestjs/common';
import {
  IssueWebhookData,
  LinearWebhookBody,
} from '../webhook/webhook.service';
import { IssueService } from '../issue/issue.service';

@Injectable()
export class WebhookIssueService {
  constructor(private issueService: IssueService) {}

  async handleIssue(json: LinearWebhookBody) {
    if (json.type !== 'Issue') {
      console.error('Expected issue data, received:', json.type);
      return;
    }

    switch (json.action) {
      case 'create':
        await this.createIssue(json.data as IssueWebhookData);
        break;
      case 'update':
        await this.updateIssue(json.data as IssueWebhookData);
        break;
      case 'remove':
        await this.issueService.remove(json.data.id);
        break;
      default:
        console.log('Unhandled webhook action:', json.action);
    }
  }

  private async createIssue(data: IssueWebhookData) {
    await this.issueService.create(data);
  }

  private async updateIssue(data: IssueWebhookData) {
    if (data.labels && data.labels.length > 0) {
      await this.issueService.updateLabelsForIssue(data.id, data.labels);
    }
    await this.issueService.update(data.id, data);
  }

  async remove(data: LinearWebhookBody['data']) {
    await this.issueService.remove(data.id);
  }
}
