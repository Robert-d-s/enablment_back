// src/issue/webhook.issue.service.ts

import { Injectable } from '@nestjs/common';
import {
  IssueWebhookData,
  LinearWebhookBody,
} from '../webhook/webhook.service'; // Update the path as necessary
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
        await this.createIssue(json.data);
        break;
      case 'update':
        await this.updateIssue(json.data);
        break;
      case 'remove':
        await this.remove(json.data);
        break;
      default:
        console.log('Unhandled webhook action:', json.action);
    }
  }

  //   async createIssue(data: LinearWebhookBody['data']) {
  //     await this.issueService.create(
  //       data.id,
  //       data.createdAt,
  //       data.updatedAt,
  //       data.title,
  //       data.DueDate,
  //       data.projectId,
  //       data.priorityLabel,
  //       data.identifier,
  //       data.assigneeName,
  //       data.projectName,
  //       data.state,
  //       data.teamKey,
  //       data.teamName,
  //     );
  //   }

  async createIssue(data: LinearWebhookBody['data']) {
    const issueData = data as IssueWebhookData;
    await this.issueService.create({
      id: issueData.id,
      createdAt: issueData.createdAt,
      updatedAt: issueData.updatedAt,
      title: issueData.title,
      dueDate: issueData.dueDate,
      projectId: issueData.projectId,
      priorityLabel: issueData.priorityLabel,
      identifier: issueData.identifier,
      assigneeName: issueData.assignee?.name || 'No Assignee',
      projectName: issueData.project?.name,
      state: issueData.state?.name,
      teamKey: issueData.team?.key,
      teamName: issueData.team?.name,
    });
  }

  async updateIssue(data: LinearWebhookBody['data']) {
    const issueData = data as IssueWebhookData;
    await this.issueService.create({
      id: issueData.id,
      createdAt: issueData.createdAt,
      updatedAt: issueData.updatedAt,
      title: issueData.title,
      dueDate: issueData.dueDate,
      projectId: issueData.projectId,
      priorityLabel: issueData.priorityLabel,
      identifier: issueData.identifier,
      assigneeName: issueData.assignee?.name,
      projectName: issueData.project?.name,
      state: issueData.state?.name,
      teamKey: issueData.team?.key,
      teamName: issueData.team?.name,
    });
  }

  async remove(data: LinearWebhookBody['data']) {
    await this.issueService.remove(data.id);
  }
}
