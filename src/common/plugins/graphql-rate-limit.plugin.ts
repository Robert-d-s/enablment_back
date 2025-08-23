import { ApolloServerPlugin } from '@apollo/server';
import { GraphQLRequestContext } from '@apollo/server';
import { GraphQLError } from 'graphql';
import { Logger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class GraphQLRateLimitPlugin implements ApolloServerPlugin {
  private readonly logger = new Logger(GraphQLRateLimitPlugin.name);
  private readonly storage = new Map<string, RateLimitEntry>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(private readonly configService: ConfigService) {
    this.windowMs =
      this.configService.get<number>('GRAPHQL_RATE_LIMIT_WINDOW') || 60000; // 1 minute
    this.maxRequests =
      this.configService.get<number>('GRAPHQL_RATE_LIMIT_MAX') || 100; // 100 requests per minute

    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  async requestDidStart() {
    return {
      didResolveOperation: async (
        requestContext: GraphQLRequestContext<any>,
      ) => {
        const clientId = this.getClientId(requestContext);
        const now = Date.now();

        let entry = this.storage.get(clientId);

        if (!entry || now > entry.resetTime) {
          // Create new entry or reset expired entry
          entry = {
            count: 1,
            resetTime: now + this.windowMs,
          };
          this.storage.set(clientId, entry);
        } else {
          // Increment existing entry
          entry.count++;

          if (entry.count > this.maxRequests) {
            this.logger.warn(
              `GraphQL rate limit exceeded for client: ${clientId}`,
            );

            throw new GraphQLError(
              `Rate limit exceeded. Maximum ${this.maxRequests} requests per ${this.windowMs / 1000} seconds`,
              {
                extensions: {
                  code: 'RATE_LIMIT_EXCEEDED',
                  maxRequests: this.maxRequests,
                  windowMs: this.windowMs,
                  retryAfter: Math.ceil((entry.resetTime - now) / 1000),
                },
              },
            );
          }
        }
      },
    };
  }

  private getClientId(requestContext: GraphQLRequestContext<any>): string {
    const context = requestContext.contextValue;

    // Try to get user ID from context
    if (context?.req?.user?.id) {
      return `user:${context.req.user.id}`;
    }

    // Fall back to IP address
    const ip = this.getClientIP(context?.req);
    return `ip:${ip}`;
  }

  private getClientIP(req: any): string {
    if (!req) return 'unknown';

    try {
      return (
        req.ip ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
        req.headers?.['x-forwarded-for']?.split(',')[0] ||
        req.headers?.['x-real-ip'] ||
        req.remoteAddress ||
        'unknown'
      );
    } catch (error) {
      this.logger.debug('Error getting client IP:', error.message);
      return 'unknown';
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.storage.entries()) {
      if (now > entry.resetTime) {
        this.storage.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(
        `Cleaned up ${cleanedCount} expired rate limit entries`,
      );
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.storage.clear();
  }
}
