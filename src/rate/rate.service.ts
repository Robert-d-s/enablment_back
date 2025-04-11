import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Rate, Prisma } from '@prisma/client';

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

  async remove(id: number): Promise<Rate | null> {
    console.log('Removing rate with ID:', id);

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.time.updateMany({
          where: { rateId: id },
          data: { rateId: { set: null } },
        });

        const deletedRate = await tx.rate.delete({
          where: { id },
        });
        return deletedRate;
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        console.warn(`Rate with ID ${id} not found for deletion.`);
        throw new NotFoundException(`Rate with ID ${id} not found.`);
      }
      console.error(`Error in removing rate ${id}:`, err);
      throw new InternalServerErrorException(`Failed to remove rate ${id}.`);
    }
  }
}
