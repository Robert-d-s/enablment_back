import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { firstValueFrom } from 'rxjs';
import { ExceptionFactory } from '../../common/exceptions';
import { PrismaService } from '../../prisma/prisma.service';
import { SanitizationService } from '../../common/services/sanitization.service';

export type TransactionClient = Parameters<
  Parameters<PrismaService['$transaction']>[0]
>[0];

interface TeamNode {
  id: string;
  name: string;
  key: string;
}

interface TeamsResponse {
  teams: {
    nodes: TeamNode[];
  };
}

@Injectable()
export class TeamSyncService {
  private linearApiKey: string;

  constructor(
    @InjectPinoLogger(TeamSyncService.name)
    private readonly logger: PinoLogger,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly sanitizationService: SanitizationService,
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
      const data = await this.fetchFromLinear<TeamsResponse>(query);
      const teams = data.teams.nodes;

      this.logger.debug(`Processing ${teams.length} teams from Linear`);

      const allTeamsInDb = await tx.team.findMany({
        select: { id: true, name: true },
      });

      const teamsToDelete = new Set(
        allTeamsInDb.map((team: { id: string }) => team.id),
      );

      for (const teamData of teams) {
        try {
          // Sanitize team data from Linear
          const sanitizedTeam =
            this.sanitizationService.sanitizeLinearTeam(teamData);

          await tx.team.upsert({
            where: { id: sanitizedTeam.id },
            update: { name: sanitizedTeam.name },
            create: { id: sanitizedTeam.id, name: sanitizedTeam.name },
          });
          teamsToDelete.delete(sanitizedTeam.id);
        } catch (sanitizationError) {
          this.logger.error(
            {
              err: sanitizationError,
              teamId: teamData.id,
              teamName: teamData.name,
            },
            'Failed to sanitize team data from Linear',
          );
          throw sanitizationError;
        }
      }

      for (const teamId of teamsToDelete) {
        this.logger.warn(
          { teamId },
          'Team no longer exists in Linear (will be handled in cleanup)',
        );
      }
      this.logger.info('Team synchronization step completed');
    } catch (error) {
      this.logger.error({ err: error }, 'Error synchronizing teams');
      throw error;
    }
  }
}
