import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { firstValueFrom } from 'rxjs';
import { ExceptionFactory } from '../../common/exceptions';
import { PrismaService } from '../../prisma/prisma.service';

export type TransactionClient = Parameters<
  Parameters<PrismaService['$transaction']>[0]
>[0];

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

@Injectable()
export class ProjectSyncService {
  private linearApiKey: string;

  constructor(
    @InjectPinoLogger(ProjectSyncService.name)
    private readonly logger: PinoLogger,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.linearApiKey = this.configService.get<string>('LINEAR_KEY') || '';
    if (!this.linearApiKey) {
      this.logger.error('LINEAR_KEY not found in environment');
    }
  }

  private async fetchFromLinear<T>(query: string, variables = {}): Promise<T> {
    try {
      this.logger.debug(
        { query: query.substring(0, 100) + '...', variables },
        'Sending query to Linear API',
      );

      if (!this.linearApiKey) {
        throw ExceptionFactory.businessLogicError(
          'Linear API query',
          'LINEAR_KEY is not configured',
        );
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
        throw ExceptionFactory.externalServiceError(
          'Linear',
          'GraphQL query',
          new Error(`GraphQL errors: ${errorMsg}`),
        );
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

  async synchronize(tx: TransactionClient): Promise<void> {
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
      await this.synchronizeProjectsForTeam(tx, team.id);
    }

    this.logger.info('Project synchronization step completed');
  }

  private async synchronizeProjectsForTeam(
    tx: TransactionClient,
    teamId: string,
  ): Promise<void> {
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
            teamId: teamId,
            cursor: endCursor,
          });

        if (!data.team || !data.team.projects) {
          this.logger.warn(
            { teamId: teamId },
            'No projects data returned for team. Skipping page.',
          );
          hasNextPage = false;
          continue;
        }

        const pageInfo: PageInfo = data.team.projects.pageInfo;
        const projects = data.team.projects.nodes;

        this.logger.debug(
          `Processing ${projects.length} projects for team ${teamId} (cursor: ${endCursor})`,
        );

        const existingProjects = await tx.project.findMany({
          where: { teamId: teamId },
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
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt),
            startDate: project.startDate || null,
            targetDate: project.targetDate || null,
            teamId: teamId,
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
        this.logger.error(
          { err: error, teamId: teamId },
          'Error synchronizing projects for team',
        );
        throw error;
      }
    }
  }
}
