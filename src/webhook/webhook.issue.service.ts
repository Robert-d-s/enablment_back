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

  // async handleIssue(json: LinearWebhookBody) {
  //   console.log('WebhookIssueService - handleIssue:', json.type, json.action);

  //   if (json.type !== 'Issue') {
  //     console.error('Expected issue data, received:', json.type);
  //     return;
  //   }
  //   const issueData = json.data as IssueWebhookData;

  //   switch (json.action) {
  //     case 'create':
  //       await this.createIssue(issueData);
  //       break;
  //     case 'update':
  //       // Process labels if they are present in the payload
  //       if (issueData.labels && issueData.labels.length > 0) {
  //         // Add issueId to each label object
  //         const labelsWithIssueId = issueData.labels.map((label) => ({
  //           ...label,
  //           issueId: issueData.id,
  //         }));
  //         await this.issueService.updateLabelsForIssue(
  //           issueData.id,
  //           labelsWithIssueId,
  //         );
  //       }
  //       await this.updateIssue(issueData);
  //       break;
  //     case 'remove':
  //       await this.issueService.remove(issueData.id);
  //       break;
  //     default:
  //       console.log('Unhandled webhook action:', json.action);
  //   }
  // }

  // async createIssue(data: LinearWebhookBody['data']) {
  //   const issueData = data as IssueWebhookData;
  //   await this.issueService.create({
  //     id: issueData.id,
  //     createdAt: issueData.createdAt,
  //     updatedAt: issueData.updatedAt,
  //     title: issueData.title,
  //     dueDate: issueData.dueDate,
  //     projectId: issueData.projectId,
  //     priorityLabel: issueData.priorityLabel,
  //     identifier: issueData.identifier,
  //     assigneeName: issueData.assignee?.name || 'No Assignee',
  //     projectName: issueData.project?.name,
  //     state: issueData.state?.name,
  //     teamKey: issueData.team?.key,
  //     teamName: issueData.team?.name,
  //     labels: issueData.labels?.map((label) => ({ id: label.id })) || [],
  //   });
  // }

  // async updateIssue(data: LinearWebhookBody['data']) {
  //   const issueData = data as IssueWebhookData;
  //   console.log('Updating issue with data:', issueData);
  //   console.log('Updating issue with data:', issueData.labels);
  //   await this.issueService.update(issueData.id, {
  //     createdAt: issueData.createdAt,
  //     updatedAt: issueData.updatedAt,
  //     title: issueData.title,
  //     dueDate: issueData.dueDate,
  //     projectId: issueData.projectId,
  //     priorityLabel: issueData.priorityLabel,
  //     identifier: issueData.identifier,
  //     assigneeName: issueData.assignee?.name,
  //     projectName: issueData.project?.name,
  //     state: issueData.state?.name,
  //     teamKey: issueData.team?.key,
  //     teamName: issueData.team?.name,
  //     labelIds: issueData.labels?.map((label) => label.id),
  //   });
  // }

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
