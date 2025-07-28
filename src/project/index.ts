// Public API exports
export { ProjectService } from './project.service';
export { ProjectResolver } from './project.resolver';
export { ProjectModule } from './project.module';
export { Project } from './project.model';

// Internal/Sync API exports (for dbSynch module)
export { ProjectSyncService } from './project-sync.service';
export { ProjectSyncData } from './project.input';

// Error exports
export {
  ProjectNotFoundError,
  InvalidProjectDatesError,
  TeamNotFoundError,
  ProjectValidationError,
} from './project.errors';

// Input/DTO exports (for potential future use)
export { CreateProjectInput, UpdateProjectInput } from './project.input';
