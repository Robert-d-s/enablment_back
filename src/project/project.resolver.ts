import { Query, Resolver } from '@nestjs/graphql';
import { Project } from './project.model';
import { ProjectService } from './project.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';

@Resolver(() => Project)
@UseGuards(AuthGuard)
export class ProjectResolver {
  constructor(private projectService: ProjectService) {}

  @Query(() => [Project])
  async projects(): Promise<Project[]> {
    return this.projectService.all();
  }
}
