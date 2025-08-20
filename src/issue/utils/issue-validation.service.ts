import { ExceptionFactory } from '../../common/exceptions';
import { IssueWebhookData } from '../../webhook/webhook.service';
import { ISSUE_CONSTANTS } from '../constants/issue.constants';

export class IssueValidationService {
  static validateCreateData(data: IssueWebhookData): void {
    const errors: string[] = [];

    // Validate projectId
    if (!data.projectId) {
      errors.push(ISSUE_CONSTANTS.ERRORS.PROJECT_ID_REQUIRED);
    }

    // Validate title
    if (!data.title?.trim()) {
      errors.push(ISSUE_CONSTANTS.ERRORS.TITLE_REQUIRED);
    } else if (
      data.title.length < ISSUE_CONSTANTS.VALIDATION.MIN_TITLE_LENGTH ||
      data.title.length > ISSUE_CONSTANTS.VALIDATION.MAX_TITLE_LENGTH
    ) {
      errors.push(ISSUE_CONSTANTS.ERRORS.INVALID_TITLE_LENGTH);
    }

    // Validate identifier
    if (!data.identifier?.trim()) {
      errors.push(ISSUE_CONSTANTS.ERRORS.IDENTIFIER_REQUIRED);
    } else if (
      data.identifier.length > ISSUE_CONSTANTS.VALIDATION.MAX_IDENTIFIER_LENGTH
    ) {
      errors.push(ISSUE_CONSTANTS.ERRORS.INVALID_IDENTIFIER_LENGTH);
    }

    if (errors.length > 0) {
      throw ExceptionFactory.validationError(
        'issueData',
        data,
        `Validation failed: ${errors.join(', ')}`,
      );
    }
  }

  static validateUpdateData(data: IssueWebhookData): void {
    const errors: string[] = [];

    // For updates, we don't require projectId but still validate other fields
    if (data.title !== undefined) {
      if (!data.title?.trim()) {
        errors.push(ISSUE_CONSTANTS.ERRORS.TITLE_REQUIRED);
      } else if (
        data.title.length < ISSUE_CONSTANTS.VALIDATION.MIN_TITLE_LENGTH ||
        data.title.length > ISSUE_CONSTANTS.VALIDATION.MAX_TITLE_LENGTH
      ) {
        errors.push(ISSUE_CONSTANTS.ERRORS.INVALID_TITLE_LENGTH);
      }
    }

    if (data.identifier !== undefined) {
      if (!data.identifier?.trim()) {
        errors.push(ISSUE_CONSTANTS.ERRORS.IDENTIFIER_REQUIRED);
      } else if (
        data.identifier.length >
        ISSUE_CONSTANTS.VALIDATION.MAX_IDENTIFIER_LENGTH
      ) {
        errors.push(ISSUE_CONSTANTS.ERRORS.INVALID_IDENTIFIER_LENGTH);
      }
    }

    if (errors.length > 0) {
      throw ExceptionFactory.validationError(
        'issueData',
        data,
        `Validation failed: ${errors.join(', ')}`,
      );
    }
  }
}
