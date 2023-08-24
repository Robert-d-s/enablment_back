import { Injectable } from '@nestjs/common';
import { PrismaClient, Rate } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class RateService {
  all(teamId: string): Promise<Rate[]> {
    return prisma.rate.findMany({
      where: {
        teamId: teamId,
      },
    });
  }

  create(name: string, rate: number, teamId: string): Promise<Rate> {
    return prisma.rate.create({
      data: {
        name,
        rate,
        teamId,
      },
    });
  }

  remove(id: number): Promise<Rate> {
    return prisma.rate.delete({
      where: {
        id,
      },
    });
  }
}
