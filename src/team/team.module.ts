import { Module } from '@nestjs/common';
import { TeamResolver } from './team.resolver';
import { TeamService } from './team.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [ConfigModule, HttpModule, PrismaModule, AuthModule, UserModule],
  providers: [TeamResolver, TeamService],
  exports: [TeamService],
})
export class TeamModule {}
