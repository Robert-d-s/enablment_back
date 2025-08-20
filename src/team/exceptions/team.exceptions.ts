import {
  ResourceNotFoundException,
  ResourceConflictException,
  ValidationException,
  DatabaseException,
} from '../../common/exceptions';

export class TeamNotFoundException extends ResourceNotFoundException {
  constructor(teamId: string, operation?: string) {
    super('Team', teamId, operation);
  }
}

export class TeamAlreadyExistsException extends ResourceConflictException {
  constructor(teamId: string) {
    super('Team', `Team with ID ${teamId} already exists`, { teamId });
  }
}

export class TeamValidationException extends ValidationException {
  constructor(field: string, value: string, reason: string) {
    super(field, value, reason);
  }
}

export class TeamOperationFailedException extends DatabaseException {
  constructor(operation: string, teamId: string, originalError?: Error) {
    super(operation, 'Team', originalError, { teamId });
  }
}
