import { Module } from '@nestjs/common';
import { IssueService } from './issue.service';
import { IssueResolver } from './issue.resolver';

@Module({
  providers: [IssueService, IssueResolver],
  exports: [IssueResolver],
})
export class IssueModule {}
