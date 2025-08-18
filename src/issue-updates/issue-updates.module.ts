import { Module } from '@nestjs/common';
import { IssueUpdatesGateway } from './issue-updates.gateway';
import { ConnectionManagerService } from './services/connection-manager.service';

@Module({
  providers: [IssueUpdatesGateway, ConnectionManagerService],
  exports: [IssueUpdatesGateway, ConnectionManagerService],
})
export class IssueUpdatesModule {}
