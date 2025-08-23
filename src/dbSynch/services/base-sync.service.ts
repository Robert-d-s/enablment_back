import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PinoLogger } from 'nestjs-pino';
import { ExceptionFactory } from '../../common/exceptions';
import { PrismaService } from '../../prisma/prisma.service';

export type TransactionClient = Parameters<
  Parameters<PrismaService['$transaction']>[0]
>[0];

@Injectable()
export abstract class BaseSyncService {
  protected linearApiKey: string;

  constructor(
    protected readonly logger: PinoLogger,
    protected readonly httpService?: HttpService,
    protected readonly configService?: ConfigService,
  ) {
    if (configService) {
      this.linearApiKey = this.configService?.get<string>('LINEAR_KEY') || '';
      if (!this.linearApiKey) {
        this.logger.error('LINEAR_KEY not found in environment');
      }
    } else {
      this.linearApiKey = '';
    }
  }

  protected async fetchFromLinear<T>(
    query: string,
    variables = {},
  ): Promise<T> {
    if (!this.httpService) {
      throw new Error('HttpService not available in this sync service');
    }

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

  abstract synchronize(tx: TransactionClient): Promise<void>;
}
