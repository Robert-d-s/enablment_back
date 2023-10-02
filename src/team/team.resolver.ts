import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { Team } from './team.model';
import { TeamService } from './team.service';
import { TeamsDTO } from './team.dto';
import { MemberDTO } from './team.dto';

// Explicitly define the expected type
interface MemberNodes {
  nodes: MemberDTO[];
}

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

  @Query(() => TeamsDTO)
  async fetchTeamsFromLinear(): Promise<TeamsDTO> {
    console.log('Entering Resolver for fetchTeamsFromLinear');

    try {
      const teams = await this.teamService.getTeams();

      // Log the data you got from the service
      console.log('Teams Data in Resolver:', JSON.stringify(teams, null, 2));

      // Log the members for each team
      console.log(
        'Members in Resolver:',
        JSON.stringify(
          teams.nodes.map((team) => team.members),
          null,
          2,
        ),
      );

      console.log(typeof teams.nodes[0].members); // should be 'object' for an array
      console.log(Array.isArray(teams.nodes[0].members)); // should be true
      console.log(
        'What is inside members?',
        JSON.stringify(teams.nodes[0].members, null, 2),
      );

      // Transform 'members' from object to array if needed
      teams.nodes.forEach((team) => {
        if (!Array.isArray(team.members)) {
          team.members = (team.members as MemberNodes).nodes || []; // Type assertion
        }
      });

      return teams;
    } catch (error) {
      // Log any errors that occur
      console.error('Error in Resolver:', error);
      throw error;
    }
  }
}
