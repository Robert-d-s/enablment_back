import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLError, ValidationContext, ValidationRule } from 'graphql';
import depthLimit from 'graphql-depth-limit';
import {
  createComplexityRule,
  fieldExtensionsEstimator,
  simpleEstimator,
} from 'graphql-query-complexity';

@Injectable()
export class GraphQLSecurityService {
  private readonly logger = new Logger(GraphQLSecurityService.name);
  private readonly maxDepth: number;
  private readonly maxComplexity: number;
  private readonly enableIntrospection: boolean;

  constructor(private readonly configService: ConfigService) {
    this.maxDepth = this.configService.get<number>('GRAPHQL_MAX_DEPTH') || 10;
    this.maxComplexity =
      this.configService.get<number>('GRAPHQL_MAX_COMPLEXITY') || 1000;
    this.enableIntrospection =
      this.configService.get<boolean>('GRAPHQL_INTROSPECTION') || false;
  }

  getDepthLimitRule(): ValidationRule {
    return depthLimit(this.maxDepth, {
      ignore: ['__schema', '__type'],
    });
  }

  getComplexityLimitRule(): ValidationRule {
    return createComplexityRule({
      maximumComplexity: this.maxComplexity,
      estimators: [
        fieldExtensionsEstimator(),
        simpleEstimator({ defaultComplexity: 1 }),
      ],
      onComplete: (complexity: number) => {
        if (complexity > this.maxComplexity * 0.8) {
          this.logger.warn(
            `High query complexity detected: ${complexity} (max: ${this.maxComplexity})`,
          );
        }
      },
      createError: (max: number, actual: number) => {
        return new GraphQLError(
          `Query complexity ${actual} exceeds maximum allowed complexity of ${max}`,
          {
            extensions: {
              code: 'QUERY_COMPLEXITY_TOO_HIGH',
              complexity: actual,
              maxComplexity: max,
            },
          },
        );
      },
    });
  }

  getIntrospectionRule(): ValidationRule | undefined {
    if (this.enableIntrospection) {
      return undefined;
    }

    return (context: ValidationContext) => {
      return {
        Field(node: any) {
          if (node.name.value === '__schema' || node.name.value === '__type') {
            context.reportError(
              new GraphQLError(
                'GraphQL introspection is disabled in production',
                {
                  nodes: [node],
                  extensions: {
                    code: 'INTROSPECTION_DISABLED',
                  },
                },
              ),
            );
          }
        },
      };
    };
  }

  getValidationRules(): ValidationRule[] {
    const rules: ValidationRule[] = [
      this.getDepthLimitRule(),
      this.getComplexityLimitRule(),
    ];

    const introspectionRule = this.getIntrospectionRule();
    if (introspectionRule) {
      rules.push(introspectionRule);
    }

    return rules;
  }

  logQueryMetrics(operationName?: string) {
    this.logger.debug(`GraphQL Query Metrics`, {
      operationName,
      maxComplexity: this.maxComplexity,
      maxDepth: this.maxDepth,
    });
  }
}
