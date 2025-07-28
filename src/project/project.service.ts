import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Project, Team } from '@prisma/client';
import { TeamLoader } from '../loaders/team.loader';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { ProjectNotFoundError } from './project.errors';

/**
 * Service for project query operations.
 * Provides read-only access to project data for GraphQL API.
 */
@Injectable()
export class ProjectService {
  constructor(
    @InjectPinoLogger(ProjectService.name)
    private readonly logger: PinoLogger,
    private prisma: PrismaService,
    private teamLoader: TeamLoader,
  ) {}

  /**
   * Retrieves all projects with enriched team names.
   * Uses DataLoader pattern to efficiently batch team lookups and prevent N+1 queries.
   */
  async all(): Promise<Array<Project & { teamName?: string }>> {
    this.logger.debug('Fetching all projects');
    const projects = await this.prisma.project.findMany({
      orderBy: { name: 'asc' },
    });

    if (!projects || projects.length === 0) {
      return [];
    }

    // Extract unique team IDs to minimize DataLoader calls
    const teamIds = [...new Set(projects.map((p) => p.teamId))];
    const teams = await this.teamLoader.byId.loadMany(teamIds);

    // Create efficient lookup map for O(1) team name resolution
    const teamMap = new Map<string, Team>();
    teams.forEach((t) => {
      if (t && !(t instanceof Error)) {
        teamMap.set(t.id, t);
      }
    });

    // Enrich projects with team names
    const projectsWithTeamNames = projects.map((project) => ({
      ...project,
      teamName: teamMap.get(project.teamId)?.name,
    }));

    return projectsWithTeamNames;
  }

  /**
   * Retrieves a single project by ID.
   * @param id Project ID
   * @throws ProjectNotFoundError if project doesn't exist
   */
  async findById(id: string): Promise<Project> {
    this.logger.debug({ projectId: id }, 'Fetching project by ID');

    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new ProjectNotFoundError(id);
    }

    return project;
  }

  /**
   * Retrieves projects for a specific team.
   * @param teamId Team ID
   */
  async findByTeamId(teamId: string): Promise<Project[]> {
    this.logger.debug({ teamId }, 'Fetching projects by team ID');

    return this.prisma.project.findMany({
      where: { teamId },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Counts total number of projects.
   */
  async count(): Promise<number> {
    this.logger.debug('Counting total projects');

    return this.prisma.project.count();
  }

  /**
   * Counts projects for a specific team.
   * @param teamId Team ID
   */
  async countByTeamId(teamId: string): Promise<number> {
    this.logger.debug({ teamId }, 'Counting projects by team ID');

    return this.prisma.project.count({
      where: { teamId },
    });
  }
}
