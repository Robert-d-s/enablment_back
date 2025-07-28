import {
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';

/**
 * Custom user-related exceptions with consistent error codes and messages
 */

export class UserNotFoundException extends NotFoundException {
  constructor(userId: number, context?: string) {
    const message = context
      ? `User with ID ${userId} not found in context: ${context}`
      : `User with ID ${userId} not found`;

    super({
      message,
      error: 'USER_NOT_FOUND',
      statusCode: 404,
      userId,
      context,
    });
  }
}

export class TeamNotFoundException extends NotFoundException {
  constructor(teamId: string, context?: string) {
    const message = context
      ? `Team with ID ${teamId} not found in context: ${context}`
      : `Team with ID ${teamId} not found`;

    super({
      message,
      error: 'TEAM_NOT_FOUND',
      statusCode: 404,
      teamId,
      context,
    });
  }
}

export class UserTeamRelationExistsException extends ConflictException {
  constructor(userId: number, teamId: string) {
    super({
      message: `User ${userId} is already a member of team ${teamId}`,
      error: 'USER_TEAM_RELATION_EXISTS',
      statusCode: 409,
      userId,
      teamId,
    });
  }
}

export class UserTeamRelationNotFoundException extends NotFoundException {
  constructor(userId: number, teamId: string) {
    super({
      message: `User ${userId} is not a member of team ${teamId}`,
      error: 'USER_TEAM_RELATION_NOT_FOUND',
      statusCode: 404,
      userId,
      teamId,
    });
  }
}

export class InvalidRoleChangeException extends BadRequestException {
  constructor(currentRole: string, newRole: string, reason?: string) {
    const message = reason
      ? `Cannot change role from ${currentRole} to ${newRole}: ${reason}`
      : `Invalid role change from ${currentRole} to ${newRole}`;

    super({
      message,
      error: 'INVALID_ROLE_CHANGE',
      statusCode: 400,
      currentRole,
      newRole,
      reason,
    });
  }
}

export class UserOperationFailedException extends InternalServerErrorException {
  constructor(operation: string, userId: number, originalError?: Error) {
    super({
      message: `Failed to ${operation} for user ${userId}`,
      error: 'USER_OPERATION_FAILED',
      statusCode: 500,
      operation,
      userId,
      originalError: originalError?.message,
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

export class UserPermissionDeniedException extends ForbiddenException {
  constructor(userId: number, operation: string, resource?: string) {
    const message = resource
      ? `User ${userId} does not have permission to ${operation} on ${resource}`
      : `User ${userId} does not have permission to ${operation}`;

    super({
      message,
      error: 'USER_PERMISSION_DENIED',
      statusCode: 403,
      userId,
      operation,
      resource,
    });
  }
}
