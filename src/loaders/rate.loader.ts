import { Injectable, Scope } from '@nestjs/common';
import * as DataLoader from 'dataloader';
import { PrismaService } from '../prisma/prisma.service';
import { Rate } from '@prisma/client';

@Injectable({ scope: Scope.REQUEST })
export class RateLoader {
  constructor(private prisma: PrismaService) {}

  readonly byId = new DataLoader<number, Rate | null>(async (ids) => {
    const rates = await this.prisma.rate.findMany({
      where: {
        id: { in: [...ids] },
      },
    });

    const rateMap = new Map(rates.map((rate) => [rate.id, rate]));
    return ids.map((id) => rateMap.get(id) || null);
  });

  readonly byTeamId = new DataLoader<string, Rate[]>(async (teamIds) => {
    const rates = await this.prisma.rate.findMany({
      where: {
        teamId: { in: [...teamIds] },
      },
    });

    const teamRatesMap = new Map<string, Rate[]>();

    teamIds.forEach((id) => {
      teamRatesMap.set(id, []);
    });

    rates.forEach((rate) => {
      const teamRates = teamRatesMap.get(rate.teamId) || [];
      teamRates.push(rate);
      teamRatesMap.set(rate.teamId, teamRates);
    });

    return teamIds.map((id) => teamRatesMap.get(id) || []);
  });
}
