import { Module } from '@nestjs/common';
import { TeamResolver } from './team.resolver';
import { TeamService } from './team.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DataLoaderModule } from '../loaders/data-loader.module';

@Module({
  imports: [PrismaModule, DataLoaderModule],
  providers: [TeamResolver, TeamService],
  exports: [TeamService],
})
export class TeamModule {}
