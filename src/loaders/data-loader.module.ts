import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TeamLoader } from './team.loader';
import { ProjectLoader } from './project.loader';
import { RateLoader } from './rate.loader';

@Module({
  imports: [PrismaModule],
  providers: [TeamLoader, ProjectLoader, RateLoader],
  exports: [TeamLoader, ProjectLoader, RateLoader],
})
export class DataLoaderModule {}
