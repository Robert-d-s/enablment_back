import { Module } from '@nestjs/common';
import { IssueService } from './issue.service';
import { IssueResolver } from './issue.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { ConfigModule } from '@nestjs/config';
import { IssueCacheService } from './services/issue-cache.service';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, ConfigModule],
  providers: [IssueService, IssueResolver, IssueCacheService],
  exports: [IssueResolver, IssueService, IssueCacheService],
})
export class IssueModule {}
