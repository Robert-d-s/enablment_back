import { Query, Resolver } from '@nestjs/graphql';
import { Team } from './team.model';
import { TeamService } from './team.service';

@Resolver(() => Team)
export class TeamResolver {
    constructor(private teamService: TeamService) {}

    @Query(() => [Team])
    async teams(): Promise<Team[]> {
        return this.teamService.all();
    }
}
