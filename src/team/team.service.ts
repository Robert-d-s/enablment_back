import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, Project, Team } from '@prisma/client';

const prisma = new PrismaClient();

type TeamWithProjectsAndRates = Prisma.TeamGetPayload<{
  include: { projects: true; rates: true };
}>;

@Injectable()
export class TeamService {
  all(): Promise<TeamWithProjectsAndRates[]> {
    return prisma.team.findMany({
      include: {
        projects: true,
        rates: true,
      },
    });
  }
}
