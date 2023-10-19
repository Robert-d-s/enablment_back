import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { LinearService } from './linear.service';
import { TeamService } from './team.service';

// async function bootstrap() {
//   const appContext = await NestFactory.createApplicationContext(AppModule);

//   const linearService = appContext.get(LinearService);
//   const teamService = appContext.get(TeamService);

//   try {
//     console.log('Fetching teams from Linear...');
//     const teamsFromLinear = await linearService.fetchTeams();

//     console.log('Transforming data for database insertion...');
//     const transformedTeams = teamsFromLinear.nodes.map((team) => ({
//       id: team.id,
//       name: team.name,
//       // Add other fields if needed
//     }));

//     console.log('Syncing data with the database...');
//     for (const teamData of transformedTeams) {
//       const existingTeam = await teamService.getTeamById(teamData.id);

//       if (existingTeam) {
//         await teamService.syncTeam(teamData.id, teamData.name);
//       } else {
//         await teamService.create(teamData.id, teamData.name);
//       }
//     }

//     console.log('Manual synchronization completed.');
//   } catch (error) {
//     console.error('Error during manual synchronization:', error);
//   } finally {
//     await appContext.close();
//   }
// }

// bootstrap();
async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);

  const linearService = appContext.get(LinearService);
  const teamService = appContext.get(TeamService);

  try {
    console.log('Fetching teams from Linear...');
    const teamsFromLinear = await linearService.fetchTeams();

    console.log('Transforming data for database insertion...');
    const transformedTeams = teamsFromLinear.nodes.map((team) => ({
      id: team.id,
      name: team.name,
      // Add other fields if needed
    }));

    console.log('Syncing data with the database...');
    const linearTeamIds = new Set(teamsFromLinear.nodes.map((team) => team.id));
    const dbTeams = await teamService.getAllTeams();

    // Handle addition and update
    for (const teamData of transformedTeams) {
      await teamService.syncTeam(teamData.id, teamData.name);
    }

    // Handle deletion
    for (const dbTeam of dbTeams) {
      if (!linearTeamIds.has(dbTeam.id)) {
        console.log(
          `Deleting team with ID: ${dbTeam.id} as it's no longer in Linear.`,
        );
        await teamService.deleteTeam(dbTeam.id);
      }
    }

    console.log('Manual synchronization completed.');
  } catch (error) {
    console.error('Error during manual synchronization:', error);
  } finally {
    await appContext.close();
  }
}

bootstrap();
