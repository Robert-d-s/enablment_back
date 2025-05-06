import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Time } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class TimeService {
  constructor( @InjectPinoLogger(TimeService.name) private readonly logger: PinoLogger, private prisma: PrismaService) {}

  all(projectId: string): Promise<Time[]> {
    this.logger.debug({ projectId }, 'Fetching all time entries for project');
    return this.prisma.time.findMany({
      where: {
        projectId,
      },
    });
  }

  async create(
    startTime: Date,
    projectId: string,
    userId: number,
    rateId: number,
    totalElapsedTime: number,
  ): Promise<Time> {
    try {
      this.logger.debug({ startTime, projectId, userId, rateId, totalElapsedTime }, 'Creating time entry');
      const createdTime = await this.prisma.time.create({
        data: { startTime, endTime: new Date(), projectId, userId, rateId, totalElapsedTime },
      });
      this.logger.info({ timeId: createdTime.id }, 'Successfully created time entry');
      return createdTime;
    } catch (error) {
      this.logger.error({ err: error, startTime, projectId, userId, rateId }, 'Error creating time entry');
      throw new InternalServerErrorException('Failed to create time entry');
    }
  }

  async update(
    id: number,
    endTime: Date,
    totalElapsedTime: number,
  ): Promise<Time> {
    try {
      const timeEntry = await this.prisma.time.findUnique({
        where: { id },
      });

      if (!timeEntry) {
        this.logger.warn({ timeId: id }, 'Time entry not found for update');
        throw new NotFoundException(`Time entry with ID ${id} not found`);
      }
      this.logger.debug({ timeId: id, endTime, totalElapsedTime }, 'Updating time entry');
      const updatedTime = await this.prisma.time.update({
        where: { id },
        data: { endTime: endTime, totalElapsedTime: totalElapsedTime },
      });
      this.logger.info({ timeId: updatedTime.id }, 'Successfully updated time entry');
      return updatedTime;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error({ err: error, timeId: id, endTime, totalElapsedTime }, 'Error updating time entry');
      throw new InternalServerErrorException(
        `Failed to update time entry ${id}`,
      );
    }
  }

  async remove(id: number): Promise<Time> {
    this.logger.info({ timeId: id }, 'Removing time entry');
    try {
      const timeEntry = await this.prisma.time.findUnique({
        where: { id },
      });

      if (!timeEntry) {
        this.logger.warn({ timeId: id }, 'Time entry not found for deletion');
        throw new NotFoundException(`Time entry with ID ${id} not found`);
      }
      const deletedTime = await this.prisma.time.delete({ where: { id } });
      this.logger.info({ timeId: id }, 'Successfully removed time entry');
      return deletedTime;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error({ err: error, timeId: id }, 'Error removing time entry');
      throw new InternalServerErrorException(
        `Failed to delete time entry ${id}`,
      );
    }
  }

  async getTotalTimeSpent(
    userId: number,
    projectId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    try {
      this.logger.debug(
        { userId, projectId, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        'Calculating total time spent for period'
      );

      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setHours(0, 0, 0, 0);

      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);

      this.logger.trace('Executing database query to aggregate total time spent...');

      const aggregatedTime = await this.prisma.time.aggregate({
        where: {
          userId,
          projectId,
          AND: [
            {
              startTime: {
                gte: adjustedStartDate,
              },
            },
            {
              endTime: {
                lte: adjustedEndDate,
              },
            },
          ],
        },
        _sum: {
          totalElapsedTime: true,
        },
      });

      const totalTime = aggregatedTime._sum.totalElapsedTime || 0;
      this.logger.debug({ totalTime }, 'Total time spent calculated');
      return totalTime;
    } catch (error) {
      this.logger.error({ err: error, userId, projectId, startDate, endDate }, 'Error calculating total time spent');
      throw new InternalServerErrorException(
        'Failed to calculate total time spent',
      );
    }
  }

  async getTotalTimeForUserProject(
    userId: number,
    projectId: string,
  ): Promise<number> {
    this.logger.debug({ userId, projectId }, 'Calculating total time for user project');
    try {
      const aggregatedTime = await this.prisma.time.aggregate({
        where: {
          userId,
          projectId,
        },
        _sum: {
          totalElapsedTime: true,
        },
      });

      const totalTime = aggregatedTime._sum.totalElapsedTime || 0;
      this.logger.debug({ totalTime }, 'Total time for user project calculated');
      return totalTime;
    } catch (error) {
      this.logger.error({ err: error, userId, projectId }, 'Error calculating total time for user project');
      throw new InternalServerErrorException(
        'Failed to calculate total time for user project',
      );
    }
  }
}
