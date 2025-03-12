import { Module } from '@nestjs/common';
import { IssueUpdatesGateway } from './issue-updates.gateway';

@Module({
  providers: [IssueUpdatesGateway],
  exports: [IssueUpdatesGateway],
})
export class IssueUpdatesModule {}
