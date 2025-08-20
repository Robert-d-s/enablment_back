import {
  BaseAppException,
  ResourceNotFoundException,
  ResourceConflictException,
  ValidationException,
  AuthorizationException,
  DatabaseException,
} from '../../common/exceptions';
import { HttpStatus } from '@nestjs/common';

/**
 * Custom user-related exceptions with consistent error codes and messages
 */

export class UserNotFoundException extends ResourceNotFoundException {
  constructor(userId: number, context?: string) {
    super('User', userId, context);
  }
}

export class TeamNotFoundException extends ResourceNotFoundException {
  constructor(teamId: string, context?: string) {
    super('Team', teamId, context);
  }
}

export class UserTeamRelationExistsException extends ResourceConflictException {
  constructor(userId: number, teamId: string) {
    super(
      'UserTeamRelation',
      `User ${userId} is already a member of team ${teamId}`,
      { userId, teamId },
    );
  }
}

export class UserTeamRelationNotFoundException extends BaseAppException {
  constructor(userId: number, teamId: string) {
    super(
      `User ${userId} is not a member of team ${teamId}`,
      'USER_TEAM_RELATION_NOT_FOUND',
      HttpStatus.NOT_FOUND,
      { userId, teamId },
    );
  }
}

export class InvalidRoleChangeException extends ValidationException {
  constructor(currentRole: string, newRole: string, reason?: string) {
    const validationReason = reason
      ? `Cannot change from ${currentRole} to ${newRole}: ${reason}`
      : `Invalid role change from ${currentRole} to ${newRole}`;
    super('role', `${currentRole} -> ${newRole}`, validationReason);
  }
}

export class UserOperationFailedException extends DatabaseException {
  constructor(operation: string, userId: number, originalError?: Error) {
    super(operation, 'User', originalError, { userId });
  }
}

export class TeamOperationFailedException extends DatabaseException {
  constructor(operation: string, teamId: string, originalError?: Error) {
    super(operation, 'Team', originalError, { teamId });
  }
}

export class UserPermissionDeniedException extends AuthorizationException {
  constructor(userId: number, operation: string, resource?: string) {
    const message = resource
      ? `User ${userId} does not have permission to ${operation} on ${resource}`
      : `User ${userId} does not have permission to ${operation}`;
    super(message, { userId, operation, resource });
  }
}
