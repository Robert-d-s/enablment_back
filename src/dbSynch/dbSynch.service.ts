import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LinearService } from '../team/linear.service';
import { TeamService } from '../team/team.service';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

@Injectable()
export class DatabaseSyncService {
  private readonly logger = new Logger(DatabaseSyncService.name);

  constructor(
    private readonly linearService: LinearService,
    private readonly teamService: TeamService,
  ) {}

  /**
   * Comprehensive database synchronization
   * This ensures all relationships are properly maintained
   */
  async synchronizeDatabase(): Promise<void> {
    this.logger.log('Starting comprehensive database synchronization');

    // Use a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // 1. First synchronize teams from Linear
      await this.synchronizeTeams(tx);

      // 2. Clean up any orphaned issues (issues with no valid team)
      await this.cleanupOrphanedIssues(tx);

      // 3. Clean up orphaned projects
      await this.cleanupOrphanedProjects(tx);

      // 4. Clean up orphaned rates
      await this.cleanupOrphanedRates(tx);
    });

    this.logger.log('Database synchronization completed successfully');
  }

  /**
   * Synchronize teams from Linear
   */
  private async synchronizeTeams(tx: any): Promise<void> {
    this.logger.log('Fetching teams from Linear');
    const teamsFromLinear = await this.linearService.fetchTeams();

    this.logger.log(
      `Processing ${teamsFromLinear.nodes.length} teams from Linear`,
    );
    const transformedTeams = teamsFromLinear.nodes.map((team) => ({
      id: team.id,
      name: team.name,
    }));

    // Get existing teams from database
    const allTeamsInDb = await tx.team.findMany({
      select: { id: true, name: true },
    });

    const teamsToDelete = new Set(allTeamsInDb.map((team) => team.id));

    // Update or create teams
    for (const teamData of transformedTeams) {
      await tx.team.upsert({
        where: { id: teamData.id },
        update: { name: teamData.name },
        create: { id: teamData.id, name: teamData.name },
      });
      teamsToDelete.delete(teamData.id);
    }

    // Handle teams that don't exist in Linear
    for (const teamId of teamsToDelete) {
      this.logger.warn(
        `Team ${teamId} no longer exists in Linear, cleaning up references`,
      );

      // Update issues to remove references to this team
      await tx.issue.updateMany({
        where: { teamKey: teamId },
        data: { teamKey: null, teamName: null },
      });

      // Now delete the team
      await tx.team.delete({
        where: { id: teamId },
      });
    }
  }

  /**
   * Clean up orphaned issues (issues with invalid team references)
   */
  private async cleanupOrphanedIssues(tx: any): Promise<void> {
    this.logger.log('Cleaning up orphaned issues');

    // Find all issues with team references
    const issuesWithTeam = await tx.issue.findMany({
      where: {
        teamKey: { not: null },
      },
      select: { id: true, teamKey: true },
    });

    // Get all valid team IDs
    const validTeamIds = new Set(
      (await tx.team.findMany({ select: { id: true } })).map((t) => t.id),
    );

    // Find issues with invalid team references
    const orphanedIssues = issuesWithTeam.filter(
      (issue) => !validTeamIds.has(issue.teamKey),
    );

    if (orphanedIssues.length > 0) {
      this.logger.warn(
        `Found ${orphanedIssues.length} issues with invalid team references`,
      );

      // Update these issues to remove the invalid team references
      for (const issue of orphanedIssues) {
        await tx.issue.update({
          where: { id: issue.id },
          data: { teamKey: null, teamName: null },
        });
      }
    }
  }

  /**
   * Clean up orphaned projects (projects with invalid team references)
   */
  private async cleanupOrphanedProjects(tx: any): Promise<void> {
    this.logger.log('Checking for projects with invalid team references');

    // Get all valid team IDs
    const validTeamIds = new Set(
      (await tx.team.findMany({ select: { id: true } })).map((t) => t.id),
    );

    // Find projects with invalid team references
    const orphanedProjects = await tx.project.findMany({
      where: {
        teamId: { notIn: Array.from(validTeamIds) },
      },
      select: { id: true, name: true, teamId: true },
    });

    if (orphanedProjects.length > 0) {
      this.logger.warn(
        `Found ${orphanedProjects.length} projects with invalid team references`,
      );

      // For projects that would be orphaned, you might want to:
      // 1. Reassign them to a default team
      // 2. Or delete them if appropriate

      // Option for deletion:
      for (const project of orphanedProjects) {
        this.logger.warn(
          `Deleting orphaned project: ${project.name} (${project.id})`,
        );
        await tx.project.delete({ where: { id: project.id } });
      }
    }
  }

  /**
   * Clean up orphaned rates (rates with invalid team references)
   */
  private async cleanupOrphanedRates(tx: any): Promise<void> {
    this.logger.log('Checking for rates with invalid team references');

    // Get all valid team IDs
    const validTeamIds = new Set(
      (await tx.team.findMany({ select: { id: true } })).map((t) => t.id),
    );

    // Find rates with invalid team references
    const orphanedRates = await tx.rate.findMany({
      where: {
        teamId: { notIn: Array.from(validTeamIds) },
      },
      select: { id: true, name: true, teamId: true },
    });

    if (orphanedRates.length > 0) {
      this.logger.warn(
        `Found ${orphanedRates.length} rates with invalid team references`,
      );

      // Delete orphaned rates
      for (const rate of orphanedRates) {
        this.logger.warn(`Deleting orphaned rate: ${rate.name} (${rate.id})`);
        await tx.rate.delete({ where: { id: rate.id } });
      }
    }
  }
}
