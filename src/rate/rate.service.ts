import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Rate, Prisma } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class RateService {
  constructor(
    @InjectPinoLogger(RateService.name)
    private readonly logger: PinoLogger,
    private prisma: PrismaService) {}

  all(teamId: string): Promise<Rate[]> {
    this.logger.debug({ teamId }, 'Fetching all rates for team');
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
    this.logger.info({ rateId: id }, 'Removing rate');
    try {
      return await this.prisma.$transaction(async (tx) => {
        this.logger.debug({ rateId: id }, 'Updating associated time entries to nullify rateId');
        await tx.time.updateMany({
          where: { rateId: id },
          data: { rateId: { set: null } },
        });

        const deletedRate = await tx.rate.delete({
          where: { id },
        });
        this.logger.info({ rateId: id }, 'Successfully removed rate');
        return deletedRate;
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        this.logger.warn({ rateId: id }, 'Rate not found for deletion.');
        throw new NotFoundException(`Rate with ID ${id} not found.`);
      }
      this.logger.error({ err: err, rateId: id }, 'Error removing rate');
      throw new InternalServerErrorException(`Failed to remove rate ${id}.`);
    }
  }
}
