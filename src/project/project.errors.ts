// Re-export standardized exceptions for backward compatibility
export {
  ExceptionFactory,
  ResourceNotFoundException,
  ValidationException,
  BusinessLogicException,
} from '../common/exceptions';

// Legacy error classes - deprecated, use ExceptionFactory instead
/** @deprecated Use ExceptionFactory.projectNotFound() instead */
export class ProjectNotFoundError extends Error {
  constructor(projectId: string) {
    super(`Project with ID ${projectId} not found`);
    this.name = 'ProjectNotFoundError';
  }
}

/** @deprecated Use ExceptionFactory.businessLogicError() instead */
export class InvalidProjectDatesError extends Error {
  constructor(message: string) {
    super(`Invalid project dates: ${message}`);
    this.name = 'InvalidProjectDatesError';
  }
}

/** @deprecated Use ExceptionFactory.teamNotFound() instead */
export class TeamNotFoundError extends Error {
  constructor(teamId: string) {
    super(`Team with ID ${teamId} not found`);
    this.name = 'TeamNotFoundError';
  }
}

/** @deprecated Use ExceptionFactory.validationError() instead */
export class ProjectValidationError extends Error {
  constructor(message: string) {
    super(`Project validation failed: ${message}`);
    this.name = 'ProjectValidationError';
  }
}
