import { Injectable } from '@nestjs/common';
import { ExceptionFactory } from '../../common/exceptions';
import { IssueUpdateMessage } from '../dto/issue-update.dto';
import { WEBSOCKET_CONSTANTS } from '../constants/websocket.constants';

@Injectable()
export class IssueUpdateValidationService {
  static validateIssueUpdate(data: unknown): IssueUpdateMessage {
    if (!data || typeof data !== 'object') {
      throw ExceptionFactory.webSocketInvalidMessage(
        WEBSOCKET_CONSTANTS.ERRORS.INVALID_MESSAGE_FORMAT,
      );
    }

    const update = data as Partial<IssueUpdateMessage>;

    // Validate required fields
    if (!update.id || typeof update.id !== 'string') {
      throw ExceptionFactory.webSocketInvalidMessage(
        'Issue ID is required and must be a string',
      );
    }

    if (
      !update.action ||
      !['create', 'update', 'remove'].includes(update.action)
    ) {
      throw ExceptionFactory.webSocketInvalidMessage(
        'Valid action is required (create, update, remove)',
      );
    }

    // Validate message size
    const messageSize = JSON.stringify(data).length;
    if (messageSize > WEBSOCKET_CONSTANTS.LIMITS.MAX_MESSAGE_SIZE) {
      throw ExceptionFactory.webSocketInvalidMessage(
        WEBSOCKET_CONSTANTS.ERRORS.MESSAGE_TOO_LARGE,
      );
    }

    // Validate optional string fields
    const stringFields: (keyof IssueUpdateMessage)[] = [
      'title',
      'state',
      'assigneeName',
      'priorityLabel',
      'teamName',
      'projectId',
      'projectName',
      'identifier',
      'dueDate',
      'createdAt',
      'updatedAt',
    ];

    for (const field of stringFields) {
      if (update[field] !== undefined && typeof update[field] !== 'string') {
        throw ExceptionFactory.webSocketInvalidMessage(
          `${field} must be a string`,
        );
      }
    }

    // Validate labels array
    if (update.labels !== undefined) {
      if (!Array.isArray(update.labels)) {
        throw ExceptionFactory.webSocketInvalidMessage(
          'Labels must be an array',
        );
      }

      for (const label of update.labels) {
        if (!label.id || !label.name || !label.color) {
          throw ExceptionFactory.webSocketInvalidMessage(
            'Each label must have id, name, and color',
          );
        }
      }
    }

    return {
      id: update.id,
      action: update.action,
      title: update.title,
      state: update.state,
      assigneeName: update.assigneeName,
      priorityLabel: update.priorityLabel,
      teamName: update.teamName,
      labels: update.labels,
      projectId: update.projectId,
      projectName: update.projectName,
      identifier: update.identifier,
      dueDate: update.dueDate,
      createdAt: update.createdAt,
      updatedAt: update.updatedAt,
    };
  }

  static sanitizeMessage(message: IssueUpdateMessage): IssueUpdateMessage {
    // Remove any potentially dangerous content
    const sanitized = { ...message };

    // Helper function to sanitize string fields
    const sanitizeString = (value: string, maxLength: number): string =>
      value.replace(/<[^>]*>/g, '').substring(0, maxLength);

    // Ensure string fields are properly escaped/sanitized
    if (sanitized.title && typeof sanitized.title === 'string') {
      sanitized.title = sanitizeString(sanitized.title, 500);
    }
    if (sanitized.state && typeof sanitized.state === 'string') {
      sanitized.state = sanitizeString(sanitized.state, 100);
    }
    if (sanitized.assigneeName && typeof sanitized.assigneeName === 'string') {
      sanitized.assigneeName = sanitizeString(sanitized.assigneeName, 200);
    }
    if (
      sanitized.priorityLabel &&
      typeof sanitized.priorityLabel === 'string'
    ) {
      sanitized.priorityLabel = sanitizeString(sanitized.priorityLabel, 100);
    }
    if (sanitized.teamName && typeof sanitized.teamName === 'string') {
      sanitized.teamName = sanitizeString(sanitized.teamName, 200);
    }
    if (sanitized.projectName && typeof sanitized.projectName === 'string') {
      sanitized.projectName = sanitizeString(sanitized.projectName, 200);
    }
    if (sanitized.identifier && typeof sanitized.identifier === 'string') {
      sanitized.identifier = sanitizeString(sanitized.identifier, 50);
    }

    return sanitized;
  }
}
