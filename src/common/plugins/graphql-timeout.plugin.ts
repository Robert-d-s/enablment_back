import { ApolloServerPlugin } from '@apollo/server';
import { GraphQLRequestContext } from '@apollo/server';
import { GraphQLError } from 'graphql';
import { Logger } from '@nestjs/common';

export interface GraphQLTimeoutPluginOptions {
  timeout?: number; // timeout in milliseconds
  createTimeoutError?: (timeout: number) => GraphQLError;
}

export class GraphQLTimeoutPlugin implements ApolloServerPlugin {
  private readonly logger = new Logger(GraphQLTimeoutPlugin.name);
  private readonly timeout: number;
  private readonly createTimeoutError: (timeout: number) => GraphQLError;

  constructor(options: GraphQLTimeoutPluginOptions = {}) {
    this.timeout = options.timeout || 30000; // 30 seconds default
    this.createTimeoutError =
      options.createTimeoutError || this.defaultTimeoutError;
  }

  async requestDidStart() {
    return {
      willSendResponse: async (requestContext: GraphQLRequestContext<any>) => {
        // Clear any timeout that might still be active
        if ((requestContext.request as any).timeoutId) {
          clearTimeout((requestContext.request as any).timeoutId);
        }
      },

      didResolveOperation: async (
        requestContext: GraphQLRequestContext<any>,
      ) => {
        // Set timeout
        const timeoutId = setTimeout(() => {
          const operationName =
            requestContext.request.operationName || 'unknown';
          this.logger.warn(
            `GraphQL operation timeout: ${operationName} (${this.timeout}ms)`,
          );

          // Note: In a real implementation, you'd need to handle request cancellation
          // This is a simplified version for demonstration
        }, this.timeout);

        // Store timeout ID to clear it later
        (requestContext.request as any).timeoutId = timeoutId;
      },

      didEncounterErrors: async (
        requestContext: GraphQLRequestContext<any>,
      ) => {
        // Clear timeout on error
        if ((requestContext.request as any).timeoutId) {
          clearTimeout((requestContext.request as any).timeoutId);
        }
      },
    };
  }

  private defaultTimeoutError(timeout: number): GraphQLError {
    return new GraphQLError(`GraphQL operation timeout after ${timeout}ms`, {
      extensions: {
        code: 'OPERATION_TIMEOUT',
        timeout,
      },
    });
  }
}
