import { ApolloServerPlugin } from '@apollo/server';
import { GraphQLRequestContext } from '@apollo/server';
import { GraphQLError } from 'graphql';
import { Logger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  getComplexity,
  fieldExtensionsEstimator,
  simpleEstimator,
} from 'graphql-query-complexity';

@Injectable()
export class GraphQLComplexityPlugin implements ApolloServerPlugin {
  private readonly logger = new Logger(GraphQLComplexityPlugin.name);
  private readonly maxComplexity: number;

  constructor(private readonly configService: ConfigService) {
    this.maxComplexity =
      this.configService.get<number>('GRAPHQL_MAX_COMPLEXITY') || 1000;
  }

  async requestDidStart() {
    return {
      didResolveOperation: async (
        requestContext: GraphQLRequestContext<any>,
      ) => {
        try {
          // Only analyze complexity if we have both document and schema
          if (requestContext.document && requestContext.schema) {
            const complexity = getComplexity({
              estimators: [
                fieldExtensionsEstimator(),
                simpleEstimator({ defaultComplexity: 1 }),
              ],
              schema: requestContext.schema,
              query: requestContext.document,
              variables: requestContext.request.variables || {},
            });

            if (complexity > this.maxComplexity) {
              throw new GraphQLError(
                `Query complexity ${complexity} exceeds maximum allowed complexity of ${this.maxComplexity}`,
                {
                  extensions: {
                    code: 'QUERY_COMPLEXITY_TOO_HIGH',
                    complexity,
                    maxComplexity: this.maxComplexity,
                  },
                },
              );
            }

            if (complexity > this.maxComplexity * 0.8) {
              this.logger.warn(
                `High query complexity detected: ${complexity} (max: ${this.maxComplexity})`,
              );
            }
          }
        } catch (error) {
          if (error.extensions?.code === 'QUERY_COMPLEXITY_TOO_HIGH') {
            throw error; // Re-throw complexity errors
          }
          // Log but don't fail for other complexity calculation errors
          this.logger.debug(
            'Skipping complexity analysis due to error:',
            error.message,
          );
        }
      },
    };
  }
}
