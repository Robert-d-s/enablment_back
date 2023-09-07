import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Team } from './team.model';
import { TeamService } from './team.service';

@Resolver(() => Team)
export class TeamResolver {
  constructor(private teamService: TeamService) {}

  // ...

  @Mutation(() => Team)
  async createTeam(@Args('name') name: string): Promise<Team> {
    return this.teamService.create(name);
  }
}
