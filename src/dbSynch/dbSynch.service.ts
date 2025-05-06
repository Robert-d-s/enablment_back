import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

interface ProjectNode {
  id: string;
  name: string;
  description: string | null;
  state: string | null;
  startDate: string | null;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TeamProjectsResponse {
  team?: {
    projects?: {
      pageInfo: PageInfo;
      nodes: ProjectNode[];
    };
  };
}

interface LabelNode {
  id: string;
  name: string;
  color: string;
  parentId?: string | null;
}

interface IssueNode {
  id: string;
  title: string;
  description?: string;
  state?: {
    id: string;
    name: string;
    color: string;
    type: string;
  };
  assignee?: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  };
  team?: {
    id: string;
    key: string;
    name: string;
  };
  priority?: number;
  priorityLabel?: string;
  identifier: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  labels?: {
    nodes: LabelNode[];
  };
}

interface IssuesResponse {
  issues: {
    pageInfo: PageInfo;
    nodes: IssueNode[];
  };
}

@Injectable()
export class DatabaseSyncService {
  private linearApiKey: string;
  constructor(
    @InjectPinoLogger(DatabaseSyncService.name)
    private readonly logger: PinoLogger,
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
    this.logger.info('Starting comprehensive database synchronization');
    try {
      await this.prisma.$transaction(async (tx) => {
        await this.synchronizeTeams(tx);
        await this.synchronizeProjects(tx);
        await this.synchronizeIssues(tx);
        await this.cleanupOrphanedRecords(tx);
      });
      this.logger.info('Database synchronization completed successfully');
    } catch (error) {
      this.logger.error({ err: error }, 'Database synchronization failed');
      throw new Error(`Synchronization failed: ${error.message}`);
    }
  }

  private async fetchFromLinear<T>(query: string, variables = {}): Promise<T> {
    try {
      this.logger.debug(
        { query: query.substring(0, 100) + '...', variables },
        'Sending query to Linear API',
      );
      if (!this.linearApiKey) {
        throw new Error('LINEAR_KEY is not configured');
      }
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.linear.app/graphql',
          { query, variables },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: this.linearApiKey,
            },
            timeout: 10000,
          },
        ),
      );

      if (response.data.errors) {
        const errorMsg = response.data.errors
          .map((e: { message: string }) => e.message)
          .join(', ');
        this.logger.error(
          { graphqlErrors: response.data.errors },
          'GraphQL errors from Linear API',
        );
        throw new Error(`GraphQL errors: ${errorMsg}`);
      }
      this.logger.debug('Successfully fetched data from Linear API');
      return response.data.data;
    } catch (error) {
      if (error.response) {
        this.logger.error(
          {
            status: error.response.status,
            data: error.response.data,
            config: error.config,
          },
          'Linear API Error - Response Received',
        );
      } else if (error.request) {
        this.logger.error(
          { err: error },
          'Linear API Error - No response received',
        );
      } else {
        this.logger.error(
          { err: error },
          'Linear API Error - Request Setup Failed',
        );
      }
      throw error;
    }
  }

  public async synchronizeTeams(tx: any): Promise<void> {
    this.logger.info('Fetching teams from Linear');

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
      const data = await this.fetchFromLinear<{
        teams: { nodes: { id: string; name: string; key: string }[] };
      }>(query);
      const teams = data.teams.nodes;

      this.logger.debug(`Processing ${teams.length} teams from Linear`);

      const allTeamsInDb = await tx.team.findMany({
        select: { id: true, name: true },
      });

      const teamsToDelete = new Set(
        allTeamsInDb.map((team: { id: string }) => team.id),
      );

      for (const teamData of teams) {
        await tx.team.upsert({
          where: { id: teamData.id },
          update: { name: teamData.name },
          create: { id: teamData.id, name: teamData.name },
        });
        teamsToDelete.delete(teamData.id);
      }

      for (const teamId of teamsToDelete) {
        this.logger.warn({ teamId }, 'Team no longer exists in Linear (will be handled in cleanup)');
      }
      this.logger.info('Team synchronization step completed.');
    } catch (error) {
      this.logger.error({ err: error }, 'Error synchronizing teams');
      throw error;
    }
  }
  public async synchronizeTeamsOnly(): Promise<void> {
    this.logger.info('Starting teams-only synchronization');

    try {
      await this.prisma.$transaction(async (tx) => {
        await this.synchronizeTeams(tx);
      });

      this.logger.info('Teams synchronization completed successfully');
    } catch (error) {
      this.logger.error({ err: error }, 'Teams synchronization failed');
      throw new Error(`Teams synchronization failed: ${error.message}`);
    }
  }
  private async synchronizeProjects(tx: any): Promise<void> {
    this.logger.info('Fetching projects from Linear team by team');

    const teamsQuery = `
      query {
        teams {
          nodes {
            id 
          }
        }
      }
    `;
    const teamsData = await this.fetchFromLinear<{
      teams: { nodes: { id: string }[] };
    }>(teamsQuery);
    const teams = teamsData.teams.nodes;

    this.logger.info(`Fetched ${teams.length} teams to process projects for.`);

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
          const data: TeamProjectsResponse =
            await this.fetchFromLinear<TeamProjectsResponse>(query, {
              teamId: team.id,
              cursor: endCursor,
            });

          if (!data.team || !data.team.projects) {
            this.logger.warn({ teamId: team.id }, 'No projects data returned for team. Skipping page.');
            hasNextPage = false;
            continue;
          }

          const pageInfo: PageInfo = data.team.projects.pageInfo;
          const projects = data.team.projects.nodes;

          this.logger.debug(
            `Processing ${projects.length} projects for team ${team.id} (cursor: ${endCursor})`,
          );

          const existingProjects = await tx.project.findMany({
            where: { teamId: team.id },
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
              teamId: team.id, 
            };

            await tx.project.upsert({
              where: { id: project.id },
              update: projectData,
              create: projectData,
            });
            existingProjectIds.delete(project.id); 
          }

          hasNextPage = pageInfo.hasNextPage;
          endCursor = pageInfo.endCursor;

          if (hasNextPage) {
            await new Promise((resolve) => setTimeout(resolve, 500)); 
          }
        } catch (error) {
          this.logger.error({ err: error, teamId: team.id }, 'Error synchronizing projects for team');
          throw error; 
        }
      }
    }
    this.logger.info('Project synchronization step completed.');
  }


  private async synchronizeIssues(tx: any): Promise<void> {
    this.logger.info('Fetching issues from Linear');

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
        const data: IssuesResponse = await this.fetchFromLinear<IssuesResponse>(
          query,
          { cursor: endCursor },
        );
        const pageInfo: PageInfo = data.issues.pageInfo;
        const issues = data.issues.nodes;

        processedCount += issues.length;
        this.logger.debug(`Processing ${issues.length} issues (total: ${processedCount}, cursor: ${endCursor})`);

        hasNextPage = pageInfo.hasNextPage;
        endCursor = pageInfo.endCursor;

        for (const issue of issues) {
          if (issue.project && issue.team) {
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
                await tx.issue.upsert({
                where: { id: issue.id },
                update: issueData,
                create: issueData,
              });

              if (issue.labels && issue.labels.nodes.length > 0) {
                await tx.label.deleteMany({
                  where: { issueId: issue.id },
                });
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
              this.logger.warn({ issueId: issue.id, projectId: issue.project.id }, 'Skipping issue: Project not found');
            }
          }
        }
      } catch (error) {
        this.logger.error({ err: error }, 'Error synchronizing issues batch');
        throw error;
      }
      if (hasNextPage) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      this.logger.info('Issue synchronization step completed.');
    }
  }

  private async cleanupOrphanedRecords(tx: any): Promise<void> {
    this.logger.info('Cleaning up orphaned records');

    const query = `
      query {
        teams { nodes { id } }
        projects { nodes { id } }
      }
    `;

    const data = await this.fetchFromLinear<{
      teams: { nodes: { id: string }[] };
      projects: { nodes: { id: string }[] };
    }>(query);

    const linearTeamIds = new Set(
      data.teams.nodes.map((t: { id: string }) => t.id),
    );
    const linearProjectIds = new Set(
      data.projects.nodes.map((p: { id: string }) => p.id),
    );

    const orphanedProjects = await tx.project.findMany({
      where: {
        id: { notIn: Array.from(linearProjectIds) },
      },
      select: { id: true, name: true },
    });

    if (orphanedProjects.length > 0) {
      this.logger.warn({ count: orphanedProjects.length }, 'Deleting orphaned projects');
      for (const project of orphanedProjects) {
        await tx.project.delete({ where: { id: project.id } });
      }
    }

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
      if (team.projects.length === 0 && team.rates.length === 0) {
        this.logger.warn({ teamId: team.id }, 'Deleting orphaned team');
        await tx.team.delete({ where: { id: team.id } });
      } else {
        this.logger.warn(
          { teamId: team.id, projectCount: team.projects.length, rateCount: team.rates.length },
          'Orphaned team has local data. Keeping it.',
        );
      }
    }
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
      this.logger.warn({ count: orphanedRates.length }, 'Deleting orphaned rates');
      for (const rate of orphanedRates) {
        await tx.rate.delete({ where: { id: rate.id } });
      }
    }
    this.logger.info('Orphaned records cleanup completed.');
  }
}
