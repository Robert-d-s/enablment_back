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
    console.log('Removing rate with ID:', id);
    return prisma.rate
      .delete({
        where: {
          id,
        },
      })
      .catch((err) => {
        console.error('Error in removing rate:', err);
        throw err;
      });
  }
}
