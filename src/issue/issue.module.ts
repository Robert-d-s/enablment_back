import { Module } from '@nestjs/common';
import { IssueService } from './issue.service';
import { IssueResolver } from './issue.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, ConfigModule],
  providers: [IssueService, IssueResolver],
  exports: [IssueResolver],
})
export class IssueModule {}
