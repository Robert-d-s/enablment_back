import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

export class TeamNotFoundException extends NotFoundException {
  constructor(teamId: string, operation?: string) {
    const message = operation
      ? `Team ${teamId} not found for ${operation}`
      : `Team ${teamId} not found`;

    super({
      message,
      error: 'TEAM_NOT_FOUND',
      statusCode: 404,
      teamId,
      operation,
    });
  }
}

export class TeamAlreadyExistsException extends ConflictException {
  constructor(teamId: string) {
    super({
      message: `Team with ID ${teamId} already exists`,
      error: 'TEAM_ALREADY_EXISTS',
      statusCode: 409,
      teamId,
    });
  }
}

export class TeamValidationException extends BadRequestException {
  constructor(field: string, value: string, reason: string) {
    super({
      message: `Invalid ${field}: ${reason}`,
      error: 'TEAM_VALIDATION_ERROR',
      statusCode: 400,
      field,
      value,
      reason,
    });
  }
}

export class TeamOperationFailedException extends InternalServerErrorException {
  constructor(operation: string, teamId: string, originalError?: Error) {
    super({
      message: `Failed to ${operation} for team ${teamId}`,
      error: 'TEAM_OPERATION_FAILED',
      statusCode: 500,
      operation,
      teamId,
      originalError: originalError?.message,
    });
  }
}
