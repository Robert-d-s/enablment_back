import { Injectable } from '@nestjs/common';
import { PrismaClient, Time } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class TimeService {
    all(projectId: string): Promise<Time[]> {
        return prisma.time.findMany({
            where: {
                projectId
            }
        })
    }

    create(startTime: Date, projectId: string, userId: number, endTime?: Date): Promise<Time> {
        return prisma.time.create({
            data: {
                startTime,
                endTime,
                projectId,
                userId
            }
        })
    }

    update(id: number, startTime?: Date, projectId?: string, userId?: number, endTime?: Date): Promise<Time> {
        return prisma.time.update({
            where: {
                id
            },
            data: {
                startTime,
                projectId,
                userId,
                endTime
            }
        })
    }

    remove(id: number): Promise<Time> {
        return prisma.time.delete({
            where: {
                id
            }
        })
    }
}
