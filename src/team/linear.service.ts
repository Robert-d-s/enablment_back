import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TeamService } from './team.service';
import fetch from 'node-fetch';
import { HttpService } from '@nestjs/axios';
import { Observable, catchError } from 'rxjs';
import { map } from 'rxjs/operators';
import { ModuleRef } from '@nestjs/core';
import { TeamsDTO } from './team.dto';
import { OrganizationDTO, OrganizationResponse } from './organization.dto';

@Injectable()
export class LinearService {
  private linearApiKey: string;
  private teamService: TeamService;

  constructor(
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
    private readonly httpService: HttpService,
  ) {
    this.linearApiKey = this.configService.get<string>('LINEAR_KEY');
    if (!this.linearApiKey) {
      throw new NotFoundException(
        'LINEAR_API_KEY not found in environment variables.',
      );
    }
  }

  onModuleInit() {
    this.teamService = this.moduleRef.get(TeamService, { strict: false });
  }

  async synchronizeTeamsWithLinear() {
    console.log('Fetching teams from Linear...');
    const teamsFromLinear = await this.fetchTeams();

    console.log('Transforming data for database insertion...');
    const transformedTeams = teamsFromLinear.nodes.map((team) => ({
      id: team.id,
      name: team.name,
    }));

    // Step 1: Retrieve all teams from the database
    const allTeamsInDb = await this.teamService.getAllTeams();
    const teamsToDelete = new Set(allTeamsInDb.map((team) => team.id));

    console.log('Syncing data with the database...');
    for (const teamData of transformedTeams) {
      const existingTeam = await this.teamService.getTeamById(teamData.id);

      if (existingTeam) {
        await this.teamService.syncTeam(teamData.id, teamData.name);
      } else {
        await this.teamService.create(teamData.id, teamData.name);
      }

      // Step 2: Remove the team's ID from the list of IDs
      teamsToDelete.delete(teamData.id);
    }

    // Step 3: Delete teams that don't exist in Linear anymore
    for (const teamId of teamsToDelete) {
      await this.teamService.deleteTeam(teamId);
    }

    console.log('Manual synchronization completed.');
  }

  async fetchTeams(): Promise<TeamsDTO> {
    const url = 'https://api.linear.app/graphql';
    const query = `
      query {
        teams {
          nodes {
            id
            name
            createdAt
            timezone
            members {
              nodes {
                id
                name
              }
            }
          }
        }
      }
    `;

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${this.linearApiKey}`,
      },
      body: JSON.stringify({ query }),
    };

    try {
      const response = await fetch(url, options);

      if (response.status !== 200) {
        console.log('HTTP Status Code:', response.status);
        return { nodes: [] };
      }

      const jsonResponse = await response.json();
      const { data } = jsonResponse;

      console.log(
        'Members for each team:',
        data.teams.nodes.map((node) => node.members),
      );

      console.log('Data returned from Linear API:', JSON.stringify(data));

      if (data && data.teams && Array.isArray(data.teams.nodes)) {
        console.log(`Fetched ${data.teams.nodes.length} teams from Linear.`);
      } else {
        console.error(
          'Failed to fetch teams from Linear or unexpected data structure.',
        );
      }

      if (data && data.teams && data.teams.nodes) {
        return data.teams;
      } else {
        console.error('Failed to fetch teams');
        console.log('Response Data:', data);
        return { nodes: [] };
      }
    } catch (error) {
      console.error('An error occurred:', error);
      return { nodes: [] };
    }
  }

  // Method to query the Linear API
  queryOrganization(): Observable<OrganizationResponse> {
    const query = `
    query Organization {
      organization {
        id
        createdAt
        updatedAt
        name
        users {
          nodes {
            id
            createdAt
            updatedAt
            name
            displayName
            email
            avatarUrl
            lastSeen
            teams {
              nodes {
                id
                createdAt
                updatedAt
                name
                key
                description
              }
            }
          }
        }
      }
    }
  `;

    const requestOptions = {
      method: 'POST',
      headers: {
        Authorization: `${this.linearApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    };

    console.log('Requesting Linear API with:', requestOptions);

    return this.httpService
      .post<{ data: { organization: OrganizationDTO } }>(
        'https://api.linear.app/graphql',
        {
          query,
        },
        {
          headers: {
            Authorization: `${this.linearApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      )
      .pipe(
        map((response) => {
          if (response.status !== 200) {
            console.error('Error response from Linear API:', response);
          }

          return {
            organization: response.data.data.organization,
          } as OrganizationResponse;
        }),
        catchError((error) => {
          console.error('Error response from Linear API:', error.response);
          if (
            error.response &&
            error.response.data &&
            error.response.data.errors
          ) {
            console.error('GraphQL Errors:', error.response.data.errors);
          }
          throw error;
        }),
      );
  }
}
