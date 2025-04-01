import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { registerEnumType } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
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

export interface GqlContext {
  req: Request & { user?: User }; // User property from AuthGuard
  res: Response;
}

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'Defines the roles a user can have',
});

@Module({
  imports: [
    ConfigModule.forRoot(),
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
