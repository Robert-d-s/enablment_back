import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DatabaseSyncService {
  private readonly logger = new Logger(DatabaseSyncService.name);
  private linearApiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.linearApiKey = this.configService.get<string>('LINEAR_KEY') || '';

    if (!this.linearApiKey) {
      this.logger.error('LINEAR_KEY not found in environment');
    }
  }

  async synchronizeDatabase(): Promise<void> {
    this.logger.log('Starting comprehensive database synchronization');

    try {
      // Use a transaction to ensure atomicity
      await this.prisma.$transaction(async (tx) => {
        // 1. Synchronize teams from Linear
        await this.synchronizeTeams(tx);

        // 2. Synchronize projects from Linear
        await this.synchronizeProjects(tx);

        // 3. Synchronize issues from Linear
        await this.synchronizeIssues(tx);

        // 4. Clean up orphaned records
        await this.cleanupOrphanedRecords(tx);
      });

      this.logger.log('Database synchronization completed successfully');
    } catch (error) {
      this.logger.error(
        `Database synchronization failed: ${error.message}`,
        error.stack,
      );
      throw new Error(`Synchronization failed: ${error.message}`);
    }
  }

  /**
   * Fetch data from Linear GraphQL API
   */
  private async fetchFromLinear(query: string, variables = {}): Promise<any> {
    try {
      this.logger.debug(
        `Sending query to Linear API: ${query.substring(0, 100)}...`,
      );
      this.logger.debug(`With variables: ${JSON.stringify(variables)}`);

      // Check if API key is present
      if (!this.linearApiKey) {
        throw new Error('LINEAR_KEY is not configured');
      }

      // Make the request with proper error handling
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.linear.app/graphql',
          { query, variables },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: this.linearApiKey, // Make sure this is a bearer token if required
            },
            timeout: 10000,
          },
        ),
      );

      // Check for GraphQL errors
      if (response.data.errors) {
        const errorMsg = response.data.errors
          .map((e: { message: string }) => e.message)
          .join(', ');
        this.logger.error(`GraphQL errors: ${errorMsg}`);
        throw new Error(`GraphQL errors: ${errorMsg}`);
      }

      return response.data.data;
    } catch (error) {
      // Log the detailed error
      if (error.response) {
        // The request was made and the server responded with a status code
        this.logger.error(
          `Linear API Error - Status: ${error.response.status}`,
        );
        this.logger.error(
          `Response data: ${JSON.stringify(error.response.data)}`,
        );
      } else if (error.request) {
        // The request was made but no response was received
        this.logger.error('Linear API Error - No response received');
      } else {
        // Something happened in setting up the request
        this.logger.error(`Linear API Error - Setup: ${error.message}`);
      }

      throw error;
    }
  }

  /**
   * Synchronize teams from Linear
   */
  public async synchronizeTeams(tx: any): Promise<void> {
    this.logger.log('Fetching teams from Linear');

    const query = `
      query {
        teams {
          nodes {
            id
            name
            key
          }
        }
      }
    `;

    try {
      const data = await this.fetchFromLinear(query);
      const teams = data.teams.nodes;

      this.logger.log(`Processing ${teams.length} teams from Linear`);

      // Get existing teams from database
      const allTeamsInDb = await tx.team.findMany({
        select: { id: true, name: true },
      });

      const teamsToDelete = new Set(
        allTeamsInDb.map((team: { id: string }) => team.id),
      );

      // Update or create teams
      for (const teamData of teams) {
        await tx.team.upsert({
          where: { id: teamData.id },
          update: { name: teamData.name },
          create: { id: teamData.id, name: teamData.name },
        });
        teamsToDelete.delete(teamData.id);
      }

      // Handle teams that don't exist in Linear
      for (const teamId of teamsToDelete) {
        this.logger.warn(`Team ${teamId} no longer exists in Linear`);
        // We don't delete teams here - this will be handled in cleanup phase
      }
    } catch (error) {
      this.logger.error(
        `Error synchronizing teams: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
  public async synchronizeTeamsOnly(): Promise<void> {
    this.logger.log('Starting teams-only synchronization');

    try {
      await this.prisma.$transaction(async (tx) => {
        await this.synchronizeTeams(tx);
      });

      this.logger.log('Teams synchronization completed successfully');
    } catch (error) {
      this.logger.error(
        `Teams synchronization failed: ${error.message}`,
        error.stack,
      );
      throw new Error(`Teams synchronization failed: ${error.message}`);
    }
  }
  /**
   * Synchronize projects from Linear
   */
  /**
   * Synchronize projects from Linear, team by team
   */
  private async synchronizeProjects(tx: any): Promise<void> {
    this.logger.log('Fetching projects from Linear team by team');

    // 1. Fetch all teams first (we need team IDs to query projects for each team)
    const teamsQuery = `
      query {
        teams {
          nodes {
            id 
          }
        }
      }
    `;
    const teamsData = await this.fetchFromLinear(teamsQuery);
    const teams = teamsData.teams.nodes;

    this.logger.log(`Fetched ${teams.length} teams to process projects for.`);

    for (const team of teams) {
      let hasNextPage = true;
      let endCursor = null;

      while (hasNextPage) {
        const query = `
            query TeamProjects($teamId: String!, $cursor: String) { 
              team(id: $teamId) {
                projects(first: 100, after: $cursor) {
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                  nodes {
                    id
                    name
                    description
                    state
                    startDate
                    targetDate
                    createdAt
                    updatedAt
                    lead {
                      id
                    }
                    status {
                      id
                      name
                      type
                    }
                  }
                }
              }
            }
          `;

        try {
          const data = await this.fetchFromLinear(query, {
            teamId: team.id, // <--- Pass team ID as variable
            cursor: endCursor,
          });

          if (!data.team || !data.team.projects) {
            this.logger.warn(
              `No projects data returned for team ${team.id}. Skipping page.`,
            );
            hasNextPage = false; // No projects for this team on this page, move to next team
            continue;
          }

          const pageInfo = data.team.projects.pageInfo;
          const projects = data.team.projects.nodes;

          this.logger.log(
            `Processing ${projects.length} projects for team ${team.id} (cursor: ${endCursor})`,
          );

          // Get existing projects from database for this team (optimize if needed)
          const existingProjects = await tx.project.findMany({
            where: { teamId: team.id }, // Filter by team ID
            select: { id: true },
          });
          const existingProjectIds = new Set(
            existingProjects.map((p: { id: string }) => p.id),
          );

          for (const project of projects) {
            const projectData = {
              id: project.id,
              name: project.name,
              description: project.description || '',
              state: project.state || 'Active',
              createdAt: project.createdAt,
              updatedAt: project.updatedAt,
              startDate: project.startDate || null,
              targetDate: project.targetDate || null,
              teamId: team.id, // <--- Team ID is now correctly set
            };

            await tx.project.upsert({
              where: { id: project.id },
              update: projectData,
              create: projectData,
            });
            existingProjectIds.delete(project.id); // Remove processed project ID
          }

          hasNextPage = pageInfo.hasNextPage;
          endCursor = pageInfo.endCursor;

          if (hasNextPage) {
            await new Promise((resolve) => setTimeout(resolve, 500)); // Rate limit delay
          }
        } catch (error) {
          this.logger.error(
            `Error synchronizing projects for team ${team.id}: ${error.message}`,
            error.stack,
          );
          throw error; // Re-throw to halt transaction
        }
      }
    }
  }

  /**
   * Synchronize issues from Linear
   */
  private async synchronizeIssues(tx: any): Promise<void> {
    this.logger.log('Fetching issues from Linear');

    // We need to query issues with pagination because there could be many
    const pageSize = 100;
    let hasNextPage = true;
    let endCursor = null;
    let processedCount = 0;

    while (hasNextPage) {
      const query = `
        query ($cursor: String) {
          issues(first: ${pageSize}, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              title
              description
              state {
                id
                name
                color
                type
              }
              assignee {
                id
                name
              }
              project {
                id
                name
              }
              team {
                id
                key
                name
              }
              priority
              priorityLabel
              identifier
              dueDate
              createdAt
              updatedAt
              labels {
                nodes {
                  id
                  name
                  color
                }
              }
            }
          }
        }
      `;

      try {
        const data = await this.fetchFromLinear(query, { cursor: endCursor });
        const pageInfo = data.issues.pageInfo;
        const issues = data.issues.nodes;

        processedCount += issues.length;
        this.logger.log(
          `Processing ${issues.length} issues (total: ${processedCount})`,
        );

        // Update pagination info
        hasNextPage = pageInfo.hasNextPage;
        endCursor = pageInfo.endCursor;

        // Process each issue
        for (const issue of issues) {
          // Only process issues with a project
          if (issue.project && issue.team) {
            // Check if the project exists
            const projectExists = await tx.project.findUnique({
              where: { id: issue.project.id },
              select: { id: true },
            });

            if (projectExists) {
              const issueData = {
                id: issue.id,
                title: issue.title,
                createdAt: issue.createdAt,
                updatedAt: issue.updatedAt,
                projectId: issue.project.id,
                projectName: issue.project.name,
                priorityLabel: issue.priorityLabel || 'No priority',
                identifier: issue.identifier,
                assigneeName: issue.assignee
                  ? issue.assignee.name
                  : 'No assignee',
                state: issue.state ? issue.state.name : 'Triage',
                teamKey: issue.team.id,
                teamName: issue.team.name,
                dueDate: issue.dueDate || null,
              };

              // Update or create the issue
              await tx.issue.upsert({
                where: { id: issue.id },
                update: issueData,
                create: issueData,
              });

              // Process labels for this issue
              if (issue.labels && issue.labels.nodes.length > 0) {
                // First, delete any existing labels
                await tx.label.deleteMany({
                  where: { issueId: issue.id },
                });

                // Then add the current ones
                for (const label of issue.labels.nodes) {
                  await tx.label.create({
                    data: {
                      id: label.id,
                      name: label.name,
                      color: label.color,
                      parentId: label.parentId || null,
                      issueId: issue.id,
                    },
                  });
                }
              }
            } else {
              this.logger.warn(
                `Skipping issue ${issue.id}: Project ${issue.project.id} not found`,
              );
            }
          }
        }
      } catch (error) {
        this.logger.error(
          `Error synchronizing issues batch: ${error.message}`,
          error.stack,
        );
        throw error;
      }

      // Add a slight delay to avoid hitting rate limits
      if (hasNextPage) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  /**
   * Clean up orphaned records after synchronization
   */
  private async cleanupOrphanedRecords(tx: any): Promise<void> {
    this.logger.log('Cleaning up orphaned records');

    // Get all Linear teams and projects
    const query = `
      query {
        teams { nodes { id } }
        projects { nodes { id } }
      }
    `;

    const data = await this.fetchFromLinear(query);

    const linearTeamIds = new Set(
      data.teams.nodes.map((t: { id: string }) => t.id),
    );
    const linearProjectIds = new Set(
      data.projects.nodes.map((p: { id: string }) => p.id),
    );

    // 1. Clean up orphaned projects (projects not in Linear)
    const orphanedProjects = await tx.project.findMany({
      where: {
        id: { notIn: Array.from(linearProjectIds) },
      },
      select: { id: true, name: true },
    });

    if (orphanedProjects.length > 0) {
      this.logger.warn(`Deleting ${orphanedProjects.length} orphaned projects`);
      for (const project of orphanedProjects) {
        await tx.project.delete({ where: { id: project.id } });
      }
    }

    // 2. Clean up orphaned teams (teams not in Linear)
    // Note: Be careful with teams as they might have manually created data
    const orphanedTeams = await tx.team.findMany({
      where: {
        id: { notIn: Array.from(linearTeamIds) },
      },
      include: {
        projects: { select: { id: true } },
        rates: { select: { id: true } },
      },
    });

    for (const team of orphanedTeams) {
      // Only delete teams that have no projects or rates
      if (team.projects.length === 0 && team.rates.length === 0) {
        this.logger.warn(`Deleting orphaned team: ${team.id}`);
        await tx.team.delete({ where: { id: team.id } });
      } else {
        this.logger.warn(
          `Team ${team.id} not found in Linear but has local data (${team.projects.length} projects, ${team.rates.length} rates). Keeping it.`,
        );
      }
    }

    // 3. Clean up orphaned rates (rates with invalid team references)
    const validTeamIds = new Set(
      (await tx.team.findMany({ select: { id: true } })).map(
        (t: { id: string }) => t.id,
      ),
    );

    const orphanedRates = await tx.rate.findMany({
      where: {
        teamId: { notIn: Array.from(validTeamIds) },
      },
      select: { id: true, name: true, teamId: true },
    });

    if (orphanedRates.length > 0) {
      this.logger.warn(`Deleting ${orphanedRates.length} orphaned rates`);
      for (const rate of orphanedRates) {
        await tx.rate.delete({ where: { id: rate.id } });
      }
    }
  }
}
