export class ProjectNotFoundError extends Error {
  constructor(projectId: string) {
    super(`Project with ID ${projectId} not found`);
    this.name = 'ProjectNotFoundError';
  }
}

export class InvalidProjectDatesError extends Error {
  constructor(message: string) {
    super(`Invalid project dates: ${message}`);
    this.name = 'InvalidProjectDatesError';
  }
}

export class TeamNotFoundError extends Error {
  constructor(teamId: string) {
    super(`Team with ID ${teamId} not found`);
    this.name = 'TeamNotFoundError';
  }
}

export class ProjectValidationError extends Error {
  constructor(message: string) {
    super(`Project validation failed: ${message}`);
    this.name = 'ProjectValidationError';
  }
}
