import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TeamService } from './team.service';
import fetch from 'node-fetch';
import { ModuleRef } from '@nestjs/core';
import { TeamsDTO } from './team.dto';

@Injectable()
export class LinearService {
  private linearApiKey: string;
  private teamService: TeamService;

  constructor(
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
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

  async syncTeams() {
    const url = 'https://api.linear.app/graphql';
    const query = `
      query {
        teams {
          nodes {
            id
            name
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

    // Fetch existing teams from database
    const dbTeams = await this.teamService.getAllTeams();

    try {
      const response = await fetch(url, options);

      console.log('HTTP Status Code:', response.status);

      const jsonResponse = await response.json();

      // Print out the entire JSON response
      console.log('Full API Response:', JSON.stringify(jsonResponse));

      const { data } = jsonResponse;

      if (data && data.teams && data.teams.nodes) {
        const linearTeamIds = new Set();
        const teams = data.teams.nodes;

        for (const team of teams) {
          linearTeamIds.add(team.id);
          await this.teamService.syncTeam(team.id, team.name);
        }

        // Delete teams from DB that are not in Linear anymore
        for (const dbTeam of dbTeams) {
          if (!linearTeamIds.has(dbTeam.id)) {
            await this.teamService.deleteTeam(dbTeam.id);
          }
        }
      } else {
        console.error('Failed to sync teams');
        console.log('Response Data:', data);
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }

  // Add this method to your existing LinearService
  async fetchTeams(): Promise<TeamsDTO> {
    // Use your Team type here instead of any[]
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

      console.log(
        'Data received in LinearService:',
        JSON.stringify(data, null, 2),
      );

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
}
