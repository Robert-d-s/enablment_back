import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Time } from '@prisma/client';

@Injectable()
export class TimeService {
  constructor(private prisma: PrismaService) {}

  all(projectId: string): Promise<Time[]> {
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
      console.log(
        'Backend Service - create called with Start Time:',
        startTime,
      );
      console.log('Backend Service - totalElapsedTime:', totalElapsedTime);

      return this.prisma.time.create({
        data: {
          startTime,
          endTime: new Date(),
          projectId,
          userId,
          rateId,
          totalElapsedTime,
        },
      });
    } catch (error) {
      console.error('Error creating time entry in service:', error);
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
        throw new NotFoundException(`Time entry with ID ${id} not found`);
      }

      console.log(`Backend Service - update called for ID ${id}`);
      console.log(
        `Backend Service - updating endTime to: ${endTime.toISOString()}`,
      );
      console.log(
        `Backend Service - updating totalElapsedTime to: ${totalElapsedTime}`,
      );

      return this.prisma.time.update({
        where: { id },
        data: {
          endTime: endTime,
          totalElapsedTime: totalElapsedTime,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error updating time entry ${id} in service:`, error);
      throw new InternalServerErrorException(
        `Failed to update time entry ${id}`,
      );
    }
  }

  async remove(id: number): Promise<Time> {
    try {
      const timeEntry = await this.prisma.time.findUnique({
        where: { id },
      });

      if (!timeEntry) {
        throw new NotFoundException(`Time entry with ID ${id} not found`);
      }

      return this.prisma.time.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
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
      console.log(
        `getTotalTimeSpent called with userId: ${userId}, projectId: ${projectId}, startDate: ${startDate.toISOString()}, endDate: ${endDate.toISOString()}`,
      );

      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setHours(0, 0, 0, 0);

      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);

      console.log('Executing database query to aggregate total time spent...');

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
      console.log(`Total time spent for the given period: ${totalTime}`);
      return totalTime;
    } catch (error) {
      console.error('Error in getTotalTimeSpent:', error);
      throw new InternalServerErrorException(
        'Failed to calculate total time spent',
      );
    }
  }

  async getTotalTimeForUserProject(
    userId: number,
    projectId: string,
  ): Promise<number> {
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

      return aggregatedTime._sum.totalElapsedTime || 0;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to calculate total time for user project',
      );
    }
  }
}
