import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { WebhookProjectService } from './webhook.project.service';
import { WebhookIssueService } from './webhook.issue.service';
import { TeamModule } from '../team/team.module';
import { IssueUpdatesModule } from '../issue-updates/issue-updates.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DatabaseSyncModule } from '../dbSynch/dbSynch.module';
import { DataLoaderModule } from 'src/loaders/data-loader.module';
import { ProjectModule } from '../project/project.module';
import { IssueModule } from '../issue/issue.module';
@Module({
  imports: [
    ConfigModule,
    TeamModule,
    IssueUpdatesModule,
    PrismaModule,
    DatabaseSyncModule,
    DataLoaderModule,
    ProjectModule,
    IssueModule,
  ],
  providers: [WebhookService, WebhookProjectService, WebhookIssueService],
  controllers: [WebhookController],
})
export class WebhookModule {}
