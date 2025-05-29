import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { LoggerModule, PinoLogger } from 'nestjs-pino';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { WebhookModule } from './webhook/webhook.module';
import { ProjectModule } from './project/project.module';
import { IssueModule } from './issue/issue.module';
import { TeamModule } from './team/team.module';
import { RateModule } from './rate/rate.module';
import { TimeModule } from './time/time.module';
import { InvoiceModule } from './invoice/invoice.module';
import { DatabaseSyncModule } from './dbSynch/dbSynch.module';
import { HttpModule } from '@nestjs/axios';
import { IssueUpdatesModule } from './issue-updates/issue-updates.module';
import { PrismaModule } from './prisma/prisma.module';
import { Request, Response } from 'express';
import { User } from './user/user.model';
import { registerEnumType } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';

export interface GqlContext {
  req: Request & { user?: User };
  res: Response;
}

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'Defines the roles a user can have',
});

@Module({
  imports: [
    ConfigModule.forRoot(),
    CommonModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info', // Use env variable for flexibility
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  colorize: true,
                  levelFirst: true, // Fixed typo
                  translateTime: 'HH:MM:ss', // Shorter time format
                  ignore: 'pid,hostname,reqId,responseTime,req,res', // Hide verbose fields
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
              // Remove headers entirely for cleaner logs
            };
          },
          res(res) {
            return {
              statusCode: res.statusCode,
            };
          },
        },
        // Reduce HTTP request logging verbosity
        autoLogging: {
          ignore: (req) => {
            // Ignore health checks, static files, etc.
            return !!(
              req.url?.includes('/health') || req.url?.includes('/favicon')
            );
          },
        },
        customProps: (req, res) => ({
          context: 'HTTP',
        }),
      },
    }),
    AuthModule,
    UserModule,
    ProjectModule,
    IssueModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: './schema.graphql',
      context: ({ req, res }: { req: Request; res: Response }): GqlContext => ({
        req: req as GqlContext['req'],
        res,
      }),
    }),
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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
