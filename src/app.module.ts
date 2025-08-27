// Third-party libraries
import { Request, Response } from 'express';
import { LoggerModule } from 'nestjs-pino';

// NestJS core imports
import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { HttpModule } from '@nestjs/axios';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { registerEnumType } from '@nestjs/graphql';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Prisma types
import { UserRole } from '@prisma/client';

// Internal modules
import { AuthGuard } from './auth/auth.guard';
import { GqlThrottlerGuard } from './common/guards/gql-throttler.guard';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { GraphQLSecurityService } from './common/services/graphql-security.service';
import { GraphQLTimeoutPlugin } from './common/plugins/graphql-timeout.plugin';
import { GraphQLRateLimitPlugin } from './common/plugins/graphql-rate-limit.plugin';
import { GraphQLComplexityPlugin } from './common/plugins/graphql-complexity.plugin';
import { DatabaseSyncModule } from './dbSynch/dbSynch.module';
import { InvoiceModule } from './invoice/invoice.module';
import { IssueModule } from './issue/issue.module';
import { IssueUpdatesModule } from './issue-updates/issue-updates.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectModule } from './project/project.module';
import { RateModule } from './rate/rate.module';
import { TeamModule } from './team/team.module';
import { TimeModule } from './time/time.module';
import { UserProfileDto } from './auth/dto/user-profile.dto';
import { UserModule } from './user/user.module';
import { WebhookModule } from './webhook/webhook.module';

export interface GqlContext {
  req: Request & { user?: UserProfileDto };
  res: Response;
}

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'Defines the roles a user can have',
});

@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60000, // 1 minute
            limit: configService.get<number>('THROTTLE_LIMIT') || 100, // 100 requests per minute
          },
          {
            name: 'auth',
            ttl: 300000, // 5 minutes
            limit: configService.get<number>('AUTH_THROTTLE_LIMIT') || 10, // 10 auth attempts per 5 minutes
          },
        ],
        skipIf: (context) => {
          // Skip throttling in test environment
          return process.env.NODE_ENV === 'test';
        },
      }),
    }),
    CommonModule,
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        pinoHttp: {
          level: configService.get<string>('LOG_LEVEL') || 'info',
          transport:
            configService.get<string>('NODE_ENV') !== 'production'
              ? {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    colorize: true,
                    levelFirst: true,
                    translateTime: 'HH:MM:ss',
                    ignore: 'pid,hostname,reqId,responseTime,req,res',
                    messageFormat: '{msg}',
                    errorLikeObjectKeys: ['err', 'error'],
                  },
                }
              : undefined,
          serializers: {
            req(req) {
              return {
                method: req.method,
                url: req.url,
              };
            },
            res(res) {
              return {
                statusCode: res.statusCode,
              };
            },
          },

          autoLogging: {
            ignore: (req) => {
              return !!(
                req.url?.includes('/health') || req.url?.includes('/favicon')
              );
            },
          },
          customProps: () => ({
            context: 'HTTP',
          }),
        },
      }),
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const graphqlSecurity = new GraphQLSecurityService(configService);
        const timeoutPlugin = new GraphQLTimeoutPlugin({
          timeout: configService.get<number>('GRAPHQL_TIMEOUT') || 30000,
        });
        const rateLimitPlugin = new GraphQLRateLimitPlugin(configService);
        const complexityPlugin = new GraphQLComplexityPlugin(configService);

        return {
          autoSchemaFile: './schema.graphql',
          sortSchema: true,
          playground: configService.get<string>('NODE_ENV') !== 'production',
          introspection:
            configService.get<boolean>('GRAPHQL_INTROSPECTION') || false,
          validationRules: graphqlSecurity.getValidationRules(),
          plugins: [timeoutPlugin, rateLimitPlugin, complexityPlugin],
          context: ({ req, res }: { req: Request; res: Response }): GqlContext => ({
            req: req as GqlContext['req'],
            res: res,
          }),
          formatError: (error) => {
            // Log security-related errors
            if (error.extensions?.code) {
              const logger = new Logger('GraphQLSecurity');
              logger.warn(`GraphQL Security Error: ${error.extensions.code}`, {
                message: error.message,
                code: error.extensions.code,
                path: error.path,
              });
            }
            return error;
          },
        };
      },
    }),
    AuthModule,
    UserModule,
    ProjectModule,
    IssueModule,
    WebhookModule,
    TeamModule,
    RateModule,
    TimeModule,
    InvoiceModule,
    DatabaseSyncModule,
    HttpModule,
    IssueUpdatesModule,
    PrismaModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
    GraphQLSecurityService,
  ],
})
export class AppModule {}
