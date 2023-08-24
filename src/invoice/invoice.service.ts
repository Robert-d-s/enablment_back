import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Invoice } from './invoice.model';

const prisma = new PrismaClient();

@Injectable()
export class InvoiceService {
  async generateInvoice(
    teamId: string,
    month: number,
    year: number,
  ): Promise<Invoice[]> {
    // Set the date range for the given month and year
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // Fetch projects and rates for the given team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        projects: true,
        rates: true,
      },
    });

    if (!team) {
      console.log('Team not found');
      return;
    }

    // Fetch time records for the projects in the given date range, including rates
    const times = await prisma.time.findMany({
      where: {
        projectId: {
          in: team.projects.map((project) => project.id),
        },
        endTime: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        rate: true,
      },
    });

    // Calculate hours and cost for each project
    const invoice = team.projects.map((project) => {
      // Filter times for the current project
      const projectTimes = times.filter(
        (time) => time.projectId === project.id,
      );

      // Calculate total hours and cost for the project
      const totalHoursAndCost = projectTimes.reduce(
        (acc, time) => {
          const duration =
            (time.endTime?.getTime() || 0) - time.startTime.getTime();
          const hours = duration / (1000 * 60 * 60);
          const cost = hours * (time.rate?.rate || 0);

          const rateId = time.rateId;
          if (!acc.rates[rateId]) {
            acc.rates[rateId] = { hours: 0, cost: 0, rateName: time.rate.name };
          }

          acc.rates[rateId].hours += hours;
          acc.rates[rateId].cost += cost;

          return acc;
        },
        { rates: {} },
      );

      // Convert rates object to an array
      const ratesArray: any[] = Object.values(totalHoursAndCost.rates);

      return {
        projectId: project.id,
        projectName: project.name,
        rates: ratesArray,
        totalHours: ratesArray.reduce((prev, cur) => prev + cur.hours, 0),
        totalCost: ratesArray.reduce((prev, cur) => prev + cur.cost, 0),
      };
    });

    return invoice;
  }
}
