import { Module } from '@nestjs/common';
import { TeamResolver } from './team.resolver';
import { TeamService } from './team.service';
import { ConfigModule } from '@nestjs/config';
import { LinearService } from './linear.service';
import { TeamSynchronizationController } from './team.synchcronization.controller';
import { HttpModule } from '@nestjs/axios';
import { OrganizationResolver } from './organization.resolver';
import { OrganizationController } from './organization.controller';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [TeamResolver, TeamService, LinearService, OrganizationResolver],
  controllers: [TeamSynchronizationController, OrganizationController],
  exports: [TeamService, LinearService],
})
export class TeamModule {}
