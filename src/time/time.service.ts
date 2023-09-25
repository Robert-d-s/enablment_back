import { Injectable } from '@nestjs/common';
import { PrismaClient, Time } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class TimeService {
  all(projectId: string): Promise<Time[]> {
    return prisma.time.findMany({
      where: {
        projectId,
      },
    });
  }

  create(
    startTime: Date,
    projectId: string,
    userId: number,
    rateId: number,
    endTime?: Date,
  ): Promise<Time> {
    const totalElapsedTime = endTime
      ? new Date(endTime).getTime() - new Date(startTime).getTime()
      : 0;

    // eslint-disable-next-line no-console
    console.log('Debugging time values:', {
      startTime,
      endTime,
      totalElapsedTime,
    });
    // eslint-disable-next-line no-console
    console.log('Debugging incoming request data:');
    console.log('startTime:', startTime);
    console.log('projectId:', projectId);
    console.log('userId:', userId);
    console.log('rateId:', rateId);
    console.log('endTime:', endTime);

    return prisma.time.create({
      data: {
        startTime,
        endTime,
        projectId,
        userId,
        rateId,
        totalElapsedTime,
      },
    });
  }

  update(
    id: number,
    startTime?: Date,
    projectId?: string,
    userId?: number,
    rateId?: number,
    endTime?: Date,
  ): Promise<Time> {
    const totalElapsedTime =
      endTime && startTime
        ? new Date(endTime).getTime() - new Date(startTime).getTime()
        : undefined;

    // eslint-disable-next-line no-console
    // console.log('Debugging time values:', {
    //   startTime,
    //   endTime,
    //   totalElapsedTime,
    // });
    // eslint-disable-next-line no-console
    console.log('Debugging incoming request data:');
    console.log('startTime:', startTime);
    console.log('projectId:', projectId);
    console.log('userId:', userId);
    console.log('rateId:', rateId);
    console.log('endTime:', endTime);

    return prisma.time.update({
      where: {
        id,
      },
      data: {
        startTime,
        projectId,
        userId,
        endTime,
        rateId,
        totalElapsedTime,
      },
    });
  }

  remove(id: number): Promise<Time> {
    return prisma.time.delete({
      where: {
        id,
      },
    });
  }

  async getTotalTimeSpent(
    userId: number,
    projectId: string,
    date: Date,
  ): Promise<number> {
    console.log(
      `Debug: UserId: ${userId}, ProjectId: ${projectId}, Date: ${date}`,
    );
    const aggregatedTime = await prisma.time.aggregate({
      where: {
        userId,
        projectId,
        AND: [
          {
            startTime: {
              gte: new Date(date.setHours(0, 0, 0, 0)),
            },
          },
          {
            endTime: {
              lte: new Date(date.setHours(23, 59, 59, 999)),
            },
          },
        ],
      },
      _sum: {
        totalElapsedTime: true,
      },
    });

    console.log('Debug: Aggregated Time:', aggregatedTime);
    return aggregatedTime._sum.totalElapsedTime || 0;
  }
}
