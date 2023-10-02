import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Team } from './team.model';
import { TeamService } from './team.service';

@Resolver(() => Team)
export class TeamResolver {
  constructor(private teamService: TeamService) {}

  @Mutation(() => Boolean)
  async syncTeams() {
    await this.teamService.syncTeamsFromLinear();
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
}
