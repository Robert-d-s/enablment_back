import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../prisma/prisma.service';
import { Team } from '@prisma/client';

@Injectable({ scope: Scope.REQUEST })
export class TeamLoader {
  constructor(private prisma: PrismaService) {}

  readonly byId = new DataLoader<string, Team | null>(
    async (ids: readonly string[]) => {
      const teams = await this.prisma.team.findMany({
        where: {
          id: { in: [...ids] },
        },
      });

      const teamMap = new Map(teams.map((team) => [team.id, team]));
      return ids.map((id) => teamMap.get(id) || null);
    },
  );

  readonly byUserId = new DataLoader<number, Team[]>(
    async (userIds: readonly number[]) => {
      const userTeams = await this.prisma.userTeam.findMany({
        where: {
          userId: { in: [...userIds] },
        },
        include: {
          team: true,
        },
      });

      const userTeamMap = new Map<number, Team[]>();

      userIds.forEach((id) => {
        userTeamMap.set(id, []);
      });

      userTeams.forEach((ut) => {
        const teams = userTeamMap.get(ut.userId) || [];
        teams.push(ut.team);
        userTeamMap.set(ut.userId, teams);
      });

      return userIds.map((id) => userTeamMap.get(id) || []);
    },
  );
}
