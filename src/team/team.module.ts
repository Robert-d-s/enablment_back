import { Module } from '@nestjs/common';
import { TeamResolver } from './team.resolver';
import { TeamService } from './team.service';
import { ConfigModule } from '@nestjs/config';
import { LinearService } from './linear.service';

@Module({
  imports: [ConfigModule],
  providers: [TeamResolver, TeamService, LinearService],
})
export class TeamModule {}
