import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { WebhookProjectService } from './webhook.project.service';
import { ProjectService } from '../project/project.service';
import { WebhookIssueService } from './webhook.issue.service';
import { IssueService } from '../issue/issue.service';
import { TeamModule } from '../team/team.module';
import { IssueUpdatesModule } from '../issue-updates/issue-updates.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DatabaseSyncModule } from '../dbSynch/dbSynch.module';
@Module({
  imports: [TeamModule, IssueUpdatesModule, PrismaModule, DatabaseSyncModule],
  providers: [
    ProjectService,
    WebhookService,
    WebhookProjectService,
    IssueService,
    WebhookIssueService,
  ],
  controllers: [WebhookController],
})
export class WebhookModule {}
