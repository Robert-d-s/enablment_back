import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Rate } from '@prisma/client';

@Injectable()
export class RateService {
  constructor(private prisma: PrismaService) {}

  all(teamId: string): Promise<Rate[]> {
    return this.prisma.rate.findMany({
      where: {
        teamId: teamId,
      },
    });
  }

  create(name: string, rate: number, teamId: string): Promise<Rate> {
    return this.prisma.rate.create({
      data: {
        name,
        rate,
        teamId,
      },
    });
  }

  async remove(id: number): Promise<Rate> {
    console.log('Removing rate with ID:', id);

    return this.prisma.$transaction(async (tx) => {
      // First, update all time entries to remove references to this rate
      await tx.time.updateMany({
        where: { rateId: id },
        data: { rateId: { set: null } },
      });

      // Then delete the rate
      try {
        return await tx.rate.delete({
          where: { id },
        });
      } catch (err) {
        console.error('Error in removing rate:', err);
        throw err;
      }
    });
  }
}
