import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, Project, Team } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

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

  public create(name: string): Promise<TeamWithProjectsAndRates> {
    return prisma.team.create({
      data: {
        id: uuidv4(),
        name,
      },
      include: {
        projects: true,
        rates: true,
      },
    });
  }
}
