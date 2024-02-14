import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { Team } from './team.model';
import { TeamService } from './team.service';
import { LinearService } from './linear.service';
import { SimpleTeamDTO } from './team.dto';

@Resolver(() => Team)
export class TeamResolver {
  constructor(
    private teamService: TeamService,
    private linearService: LinearService,
  ) {}

  @Mutation(() => Boolean)
  async syncTeams() {
    await this.linearService.synchronizeTeamsWithLinear();
    return true;
  }

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
}
