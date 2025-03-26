import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Invoice, RateDetail } from './invoice.model';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  async generateInvoiceForProject(
    projectId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Invoice> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          time: {
            where: {
              startTime: { gte: startDate },
              endTime: { lte: endDate },
            },
            include: {
              rate: true,
            },
          },
        },
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      let totalHours = 0;
      let totalCost = 0;
      const ratesMap: { [key: number]: RateDetail & { ratePerHour: number } } =
        {};

      project.time.forEach((entry) => {
        if (!entry.rate) return;

        const hours = entry.totalElapsedTime / 3600000;
        totalHours += hours;
        totalCost += hours * entry.rate.rate;

        const rateId = entry.rateId as number;
        if (!ratesMap[rateId]) {
          ratesMap[rateId] = {
            rateId,
            rateName: entry.rate.name,
            hours: 0,
            cost: 0,
            ratePerHour: entry.rate.rate,
          };
        }

        ratesMap[rateId].hours += hours;
        ratesMap[rateId].cost += hours * entry.rate.rate;
      });

      const rates = Object.values(ratesMap).map((rate) => ({
        ...rate,
        hours: Math.round(rate.hours * 100) / 100,
        cost: Math.round(rate.cost * 100) / 100,
      }));

      return {
        projectId: project.id,
        projectName: project.name,
        totalHours: Math.round(totalHours * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        rates,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to generate invoice for project',
      );
    }
  }
}
