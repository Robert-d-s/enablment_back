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
    return prisma.time.create({
      data: {
        startTime,
        endTime,
        projectId,
        userId,
        rateId,
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
}
