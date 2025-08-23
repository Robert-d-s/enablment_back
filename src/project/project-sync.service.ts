import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Project } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { ProjectSyncData } from './project.input';
import { ExceptionFactory } from '../common/exceptions';

/**
 * Internal service for project synchronization operations.
 * Used exclusively by the dbSynch module for Linear data synchronization.
 *
 * @internal This service is not intended for direct use by GraphQL resolvers.
 */
@Injectable()
export class ProjectSyncService {
  constructor(
    @InjectPinoLogger(ProjectSyncService.name)
    private readonly logger: PinoLogger,
    private prisma: PrismaService,
  ) {}

  /**
   * Creates a new project from sync data.
   * Used during Linear synchronization process.
   *
   * @internal
   */
  async createFromSync(data: ProjectSyncData): Promise<Project> {
    this.logger.info(
      { projectId: data.id, name: data.name, teamId: data.teamId },
      'Creating project from sync',
    );

    this.validateProjectData(data);
    await this.validateTeamExists(data.teamId);

    const project = await this.prisma.project.create({
      data: {
        id: data.id,
        name: data.name,
        team: {
          connect: { id: data.teamId },
        },
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        description: data.description || null,
        state: data.state || 'Active',
        startDate: data.startDate || null,
        targetDate: data.targetDate || null,
      },
    });

    return project;
  }

  /**
   * Updates or creates a project from sync data (upsert operation).
   * Used during Linear synchronization process.
   *
   * @internal
   */
  async upsertFromSync(data: ProjectSyncData): Promise<Project> {
    this.logger.info({ projectId: data.id }, 'Upserting project from sync');

    this.validateProjectData(data);
    await this.validateTeamExists(data.teamId);

    const result = await this.prisma.project.upsert({
      where: {
        id: data.id,
      },
      update: {
        name: data.name,
        teamId: data.teamId,
        updatedAt: new Date(data.updatedAt),
        description: data.description || null,
        state: data.state || 'Active',
        startDate: data.startDate || null,
        targetDate: data.targetDate || null,
      },
      create: {
        id: data.id,
        name: data.name,
        teamId: data.teamId,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        description: data.description || null,
        state: data.state || 'Active',
        startDate: data.startDate || null,
        targetDate: data.targetDate || null,
      },
    });

    return result;
  }

  /**
   * Removes a project during sync cleanup.
   * Used when projects are deleted from Linear.
   *
   * @internal
   */
  async removeFromSync(id: string): Promise<Project | null> {
    this.logger.info({ projectId: id }, 'Removing project from sync');

    try {
      const deleted = await this.prisma.project.delete({ where: { id } });
      this.logger.info(
        { projectId: id },
        'Successfully removed project from sync',
      );
      return deleted;
    } catch (error) {
      this.logger.error(
        { err: error, projectId: id },
        'Error removing project from sync',
      );
      return null;
    }
  }

  /**
   * Validates project data for business rules.
   */
  private validateProjectData(data: ProjectSyncData): void {
    if (!data.id?.trim()) {
      throw ExceptionFactory.validationError(
        'projectId',
        data.id,
        'Project ID is required',
      );
    }

    if (!data.name?.trim()) {
      throw ExceptionFactory.validationError(
        'projectName',
        data.name,
        'Project name is required',
      );
    }

    if (!data.teamId?.trim()) {
      throw ExceptionFactory.validationError(
        'teamId',
        data.teamId,
        'Team ID is required',
      );
    }

    // Validate date logic if both dates are provided
    if (data.startDate && data.targetDate) {
      const startDate = new Date(data.startDate);
      const targetDate = new Date(data.targetDate);

      if (isNaN(startDate.getTime()) || isNaN(targetDate.getTime())) {
        throw ExceptionFactory.validationError(
          'projectDates',
          { startDate: data.startDate, targetDate: data.targetDate },
          'Invalid date format',
        );
      }

      if (startDate > targetDate) {
        throw ExceptionFactory.validationError(
          'projectDates',
          { startDate: data.startDate, targetDate: data.targetDate },
          'Start date cannot be after target date',
        );
      }
    }
  }

  /**
   * Validates that the team exists before creating/updating a project.
   */
  private async validateTeamExists(teamId: string): Promise<void> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true },
    });

    if (!team) {
      throw ExceptionFactory.teamNotFound(teamId, 'project validation');
    }
  }
}
