import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectResolver } from './project.resolver';

@Module({
  providers: [ProjectService, ProjectResolver],
  exports: [ProjectResolver],
})
export class ProjectModule {}
