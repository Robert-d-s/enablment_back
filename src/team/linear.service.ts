// import { Injectable, NotFoundException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { TeamService } from './team.service';
// import fetch from 'node-fetch';
// import { ModuleRef } from '@nestjs/core';
// import { TeamsDTO } from './team.dto';

// @Injectable()
// export class LinearService {
//   private linearApiKey: string;
//   private teamService: TeamService;

//   constructor(
//     private readonly configService: ConfigService,
//     private readonly moduleRef: ModuleRef,
//   ) {
//     this.linearApiKey = this.configService.get<string>('LINEAR_KEY');
//     if (!this.linearApiKey) {
//       throw new NotFoundException(
//         'LINEAR_API_KEY not found in environment variables.',
//       );
//     }
//   }

//   onModuleInit() {
//     this.teamService = this.moduleRef.get(TeamService, { strict: false });
//   }

//   // async syncTeams() {
//   //   console.log('Starting the teams synchronization process...');
//   //   const url = 'https://api.linear.app/graphql';
//   //   const query = `
//   //     query {
//   //       teams {
//   //         nodes {
//   //           id
//   //           name
//   //         }
//   //       }
//   //     }
//   //   `;

//   //   const options = {
//   //     method: 'POST',
//   //     headers: {
//   //       'Content-Type': 'application/json',
//   //       Authorization: `${this.linearApiKey}`,
//   //     },
//   //     body: JSON.stringify({ query }),
//   //   };

//   //   // Fetch existing teams from database
//   //   const dbTeams = await this.teamService.getAllTeams();
//   //   console.log(
//   //     `Fetched ${dbTeams.length} teams from the database. IDs: ${dbTeams
//   //       .map((team) => team.id)
//   //       .join(', ')}`,
//   //   );

//   //   try {
//   //     const response = await fetch(url, options);
//   //     console.log(`Linear API responded with status: ${response.status}`);

//   //     console.log('HTTP Status Code:', response.status);

//   //     const jsonResponse = await response.json();

//   //     // Print out the entire JSON response
//   //     console.log('Full API Response:', JSON.stringify(jsonResponse));

//   //     const { data } = jsonResponse;

//   //     if (data && data.teams && data.teams.nodes) {
//   //       const linearTeamIds = new Set();
//   //       const teams = data.teams.nodes;

//   //       for (const team of teams) {
//   //         console.log(
//   //           `Syncing team with ID: ${team.id} and Name: ${team.name}`,
//   //         );

//   //         linearTeamIds.add(team.id);
//   //         await this.teamService.syncTeam(team.id, team.name);
//   //       }

//   //       // Delete teams from DB that are not in Linear anymore
//   //       for (const dbTeam of dbTeams) {
//   //         if (!linearTeamIds.has(dbTeam.id)) {
//   //           console.log(
//   //             `Deleting team with ID: ${dbTeam.id} as it's no longer in Linear.`,
//   //           );
//   //           await this.teamService.deleteTeam(dbTeam.id);
//   //         }
//   //       }
//   //       console.log('Teams synchronization process completed.');
//   //     } else {
//   //       console.error('Failed to sync teams');
//   //       console.log('Response Data:', data);
//   //     }
//   //   } catch (error) {
//   //     console.error('An error occurred:', error);
//   //   }
//   // }
//   async syncTeams() {
//     // 1. Starting the sync process.
//     console.log('Starting the teams synchronization process...');
//     const url = 'https://api.linear.app/graphql';

//     const query = `
//       query {
//         teams {
//           nodes {
//             id
//             name
//           }
//         }
//       }
//     `;

//     const options = {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `${this.linearApiKey}`,
//       },
//       body: JSON.stringify({ query }),
//     };

//     // 2. Fetching teams from the database.
//     console.log('Fetching teams from the database...');
//     const dbTeams = await this.teamService.getAllTeams();
//     console.log(
//       `Fetched ${dbTeams.length} teams from the database. IDs: ${dbTeams
//         .map((team) => team.id)
//         .join(', ')}`,
//     );
//     const maskedKey = this.linearApiKey
//       .slice(-4)
//       .padStart(this.linearApiKey.length, '*');
//     console.log(`Using Linear API key ending in: ${maskedKey}`);

//     try {
//       console.log('Making request to Linear API...');
//       const response = await fetch(url, options);

//       if (response.status !== 200) {
//         console.log('HTTP Status Code:', response.status);
//         const errorResponse = await response.text(); // Capture the response body
//         console.error('Error Response Body:', errorResponse);
//         // Continue or break depending on how you want to handle this
//         return;
//       }

//       // 3. Logging the HTTP status of the Linear API response.
//       console.log(`Linear API responded with status: ${response.status}`);

//       const jsonResponse = await response.json();

//       // 4. Logging the entire response from Linear.
//       console.log('Full API Response:', JSON.stringify(jsonResponse));

//       const { data } = jsonResponse;

//       if (data && data.teams && data.teams.nodes) {
//         const linearTeamIds = new Set();
//         const teams = data.teams.nodes;

//         for (const team of teams) {
//           // 5. Logging each team being synced.
//           console.log(
//             `Syncing team with ID: ${team.id} and Name: ${team.name}`,
//           );

//           linearTeamIds.add(team.id);
//           try {
//             await this.teamService.syncTeam(team.id, team.name);
//           } catch (err) {
//             console.error(
//               `Error syncing team with ID: ${team.id} and Name: ${team.name}`,
//               err,
//             );
//           }
//         }

//         // 6. Logging the teams being deleted.
//         for (const dbTeam of dbTeams) {
//           if (!linearTeamIds.has(dbTeam.id)) {
//             console.log(
//               `Deleting team with ID: ${dbTeam.id} as it's no longer in Linear.`,
//             );
//             try {
//               await this.teamService.deleteTeam(dbTeam.id);
//             } catch (err) {
//               console.error(`Error deleting team with ID: ${dbTeam.id}`, err);
//             }
//           }
//         }
//         // 7. Sync process completed.
//         console.log('Teams synchronization process completed.');
//       } else {
//         console.error('Failed to sync teams. Data structure not as expected.');
//         console.log('Response Data:', data);
//       }
//     } catch (error) {
//       // 8. Logging any exceptions that might occur.
//       console.error('An error occurred during the sync process:', error);
//     }
//   }

//   // Add this method to your existing LinearService
//   async fetchTeams(): Promise<TeamsDTO> {
//     // Use your Team type here instead of any[]
//     const url = 'https://api.linear.app/graphql';
//     const query = `
//     query {
//       teams {
//         nodes {
//           id
//           name
//           createdAt
//           timezone
//           members {
//             nodes {
//               id
//               name
//             }
//           }
//         }
//       }
//     }
//   `;

//     const options = {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `${this.linearApiKey}`,
//       },
//       body: JSON.stringify({ query }),
//     };

//     try {
//       const response = await fetch(url, options);

//       if (response.status !== 200) {
//         console.log('HTTP Status Code:', response.status);
//         return { nodes: [] };
//       }

//       const jsonResponse = await response.json();
//       const { data } = jsonResponse;

//       console.log(
//         'Members for each team:',
//         data.teams.nodes.map((node) => node.members),
//       );

//       console.log('Data returned from Linear API:', JSON.stringify(data));

//       console.log(
//         'Data received in LinearService:',
//         JSON.stringify(data, null, 2),
//       );

//       if (data && data.teams && Array.isArray(data.teams.nodes)) {
//         console.log(`Fetched ${data.teams.nodes.length} teams from Linear.`);
//       } else {
//         console.error(
//           'Failed to fetch teams from Linear or unexpected data structure.',
//         );
//       }

//       if (data && data.teams && data.teams.nodes) {
//         return data.teams;
//       } else {
//         console.error('Failed to fetch teams');
//         console.log('Response Data:', data);
//         return { nodes: [] };
//       }
//     } catch (error) {
//       console.error('An error occurred:', error);
//       return { nodes: [] };
//     }
//   }

//   async manualSync() {
//     console.log('Manually syncing teams...');

//     // Call the fetchTeams method to get teams from Linear API
//     const teamsFromLinear = await this.fetchTeams();

//     // Process the teams as required, e.g., save them to your database.
//     // Here, I'm just logging them, but you would adjust based on your needs.
//     console.log('Teams from Linear:', teamsFromLinear);

//     // ... Further processing logic if needed ...

//     console.log('Manual sync completed.');
//   }
// }
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

  // async synchronizeTeamsWithLinear() {
  //   console.log('Fetching teams from Linear...');
  //   const teamsFromLinear = await this.fetchTeams();

  //   console.log('Transforming data for database insertion...');
  //   const transformedTeams = teamsFromLinear.nodes.map((team) => ({
  //     id: team.id,
  //     name: team.name,
  //     // Add other fields if needed
  //   }));

  //   console.log('Syncing data with the database...');
  //   for (const teamData of transformedTeams) {
  //     const existingTeam = await this.teamService.getTeamById(teamData.id);

  //     if (existingTeam) {
  //       await this.teamService.syncTeam(teamData.id, teamData.name);
  //     } else {
  //       await this.teamService.create(teamData.id, teamData.name);
  //     }
  //   }

  //   console.log('Manual synchronization completed.');
  // }

  async synchronizeTeamsWithLinear() {
    console.log('Fetching teams from Linear...');
    const teamsFromLinear = await this.fetchTeams();

    console.log('Transforming data for database insertion...');
    const transformedTeams = teamsFromLinear.nodes.map((team) => ({
      id: team.id,
      name: team.name,
      // Add other fields if needed
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
}
