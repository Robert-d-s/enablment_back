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

@Injectable()
export class CleanupSyncService {
  private linearApiKey: string;

  constructor(
    @InjectPinoLogger(CleanupSyncService.name)
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

    await this.cleanupOrphanedProjects(tx, linearProjectIds);
    await this.cleanupOrphanedTeams(tx, linearTeamIds);
    await this.cleanupOrphanedRates(tx);

    this.logger.info('Orphaned records cleanup completed');
  }

  private async cleanupOrphanedProjects(
    tx: TransactionClient,
    linearProjectIds: Set<string>,
  ): Promise<void> {
    const orphanedProjects = await tx.project.findMany({
      where: {
        id: { notIn: Array.from(linearProjectIds) },
      },
      select: { id: true, name: true },
    });

    if (orphanedProjects.length > 0) {
      this.logger.warn(
        { count: orphanedProjects.length },
        'Deleting orphaned projects',
      );
      for (const project of orphanedProjects) {
        await tx.project.delete({ where: { id: project.id } });
      }
    }
  }

  private async cleanupOrphanedTeams(
    tx: TransactionClient,
    linearTeamIds: Set<string>,
  ): Promise<void> {
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
          {
            teamId: team.id,
            projectCount: team.projects.length,
            rateCount: team.rates.length,
          },
          'Orphaned team has local data. Keeping it.',
        );
      }
    }
  }

  private async cleanupOrphanedRates(tx: TransactionClient): Promise<void> {
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
      this.logger.warn(
        { count: orphanedRates.length },
        'Deleting orphaned rates',
      );
      for (const rate of orphanedRates) {
        await tx.rate.delete({ where: { id: rate.id } });
      }
    }
  }
}
