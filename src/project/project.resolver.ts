import { Query, Resolver, Args, Int } from '@nestjs/graphql';
import { Project } from './project.model';
import { ProjectService } from './project.service';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

/**
 * GraphQL resolver for project queries.
 * Provides read-only access to project data.
 *
 * Note: Project mutations (create/update/delete) are handled by the dbSynch module
 * as projects are managed externally in Linear and synchronized to this database.
 */
@Resolver(() => Project)
export class ProjectResolver {
  constructor(
    @InjectPinoLogger(ProjectResolver.name)
    private readonly logger: PinoLogger,
    private projectService: ProjectService,
  ) {}

  /**
   * Query to get all projects with team names enriched.
   */
  @Query(() => [Project])
  async projects(): Promise<Project[]> {
    this.logger.debug('Executing projects query');
    return this.projectService.all();
  }

  /**
   * Query to get a specific project by ID.
   */
  @Query(() => Project)
  async project(@Args('id') id: string): Promise<Project> {
    this.logger.debug({ projectId: id }, 'Executing project query');
    return this.projectService.findById(id);
  }

  /**
   * Query to get projects for a specific team.
   */
  @Query(() => [Project])
  async projectsByTeam(@Args('teamId') teamId: string): Promise<Project[]> {
    this.logger.debug({ teamId }, 'Executing projectsByTeam query');
    return this.projectService.findByTeamId(teamId);
  }

  /**
   * Query to get total project count.
   */
  @Query(() => Int)
  async projectCount(): Promise<number> {
    this.logger.debug('Executing projectCount query');
    return this.projectService.count();
  }

  /**
   * Query to get project count for a specific team.
   */
  @Query(() => Int)
  async projectCountByTeam(@Args('teamId') teamId: string): Promise<number> {
    this.logger.debug({ teamId }, 'Executing projectCountByTeam query');
    return this.projectService.countByTeamId(teamId);
  }

  // NOTE: Project mutations are not exposed here because projects are managed
  // externally in Linear and synchronized via the dbSynch module.
  //
  // If project mutations were needed, they would look like:
  //
  // @Mutation(() => Project)
  // async createProject(@Args('input') input: CreateProjectInput): Promise<Project> {
  //   return this.projectService.create(input);
  // }
  //
  // @Mutation(() => Project)
  // async updateProject(@Args('input') input: UpdateProjectInput): Promise<Project> {
  //   return this.projectService.update(input);
  // }
}
