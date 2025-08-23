import { Module } from '@nestjs/common';
import { IssueUpdatesGateway } from './issue-updates.gateway';
import { ConnectionManagerService } from './services/connection-manager.service';
import { WebSocketAuthGuard } from './guards/websocket-auth.guard';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  providers: [
    IssueUpdatesGateway,
    ConnectionManagerService,
    WebSocketAuthGuard,
  ],
  exports: [IssueUpdatesGateway, ConnectionManagerService],
})
export class IssueUpdatesModule {}
