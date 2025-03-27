import {
  Args,
  Mutation,
  Resolver,
  Query,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { Team } from './team.model';
import { TeamService } from './team.service';
import { SimpleTeamDTO } from './team.model';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ProjectLoader } from '../loaders/project.loader';
import { RateLoader } from '../loaders/rate.loader';
import { Project } from '../project/project.model';
import { Rate } from '../rate/rate.model';

@Resolver(() => Team)
@UseGuards(AuthGuard)
export class TeamResolver {
  constructor(
    private teamService: TeamService,
    private projectLoader: ProjectLoader,
    private rateLoader: RateLoader,
  ) {}

  @Mutation(() => Team)
  async createTeam(
    @Args('id') id: string,
    @Args('name') name: string,
  ): Promise<Team> {
    const team = await this.teamService.create(id, name);
    return {
      ...team,
      projects: [],
      rates: [],
    };
  }

  @Query(() => [SimpleTeamDTO])
  async getAllSimpleTeams(): Promise<SimpleTeamDTO[]> {
    return this.teamService.getAllSimpleTeams();
  }

  @ResolveField(() => [Project])
  async projects(@Parent() team: Team): Promise<Project[]> {
    // This will be called only when projects field is requested
    // Uses DataLoader to batch and cache the requests
    return this.projectLoader.byTeamId.load(team.id);
  }

  @ResolveField(() => [Rate])
  async rates(@Parent() team: Team): Promise<Rate[]> {
    // This will be called only when rates field is requested
    // Uses DataLoader to batch and cache the requests
    return this.rateLoader.byTeamId.load(team.id);
  }
}
