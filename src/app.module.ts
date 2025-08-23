// Third-party libraries
import { Request, Response } from 'express';
import { LoggerModule } from 'nestjs-pino';

// NestJS core imports
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { HttpModule } from '@nestjs/axios';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { registerEnumType } from '@nestjs/graphql';

// Prisma types
import { UserRole } from '@prisma/client';

// Internal modules
import { AuthGuard } from './auth/auth.guard';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
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
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: './schema.graphql',
      sortSchema: true,
      playground: false,
      context: (context: { req: Request; res: Response }): GqlContext => ({
        req: context.req as GqlContext['req'],
        res: context.res,
      }),
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
  ],
})
export class AppModule {}
