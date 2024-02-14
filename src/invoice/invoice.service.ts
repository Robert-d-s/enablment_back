// import { Injectable } from '@nestjs/common';
// import { PrismaClient } from '@prisma/client';
// import { Invoice, RateDetail } from './invoice.model';

// const prisma = new PrismaClient();

// @Injectable()
// export class InvoiceService {
//   async generateInvoiceForProject(
//     projectId: string,
//     startDate: Date,
//     endDate: Date,
//   ): Promise<Invoice> {
//     const project = await prisma.project.findUnique({
//       where: { id: projectId },
//       include: {
//         time: {
//           where: {
//             startTime: { gte: startDate },
//             endTime: { lte: endDate },
//           },
//           include: { rate: true },
//         },
//       },
//     });

//     if (!project) throw new Error('Project not found');

//     let totalHours = 0;
//     let totalCost = 0;
//     const ratesMap: { [key: number]: RateDetail } = {};

//     project.time.forEach((entry) => {
//       const hours = entry.totalElapsedTime / 3600000; // Convert milliseconds to hours
//       totalHours += hours;
//       totalCost += hours * entry.rate.rate;

//       if (!ratesMap[entry.rateId]) {
//         ratesMap[entry.rateId] = {
//           rateId: entry.rateId,
//           rateName: entry.rate.name,
//           hours: 0,
//           cost: 0,
//         };
//       }

//       ratesMap[entry.rateId].hours += hours;
//       ratesMap[entry.rateId].cost += hours * entry.rate.rate;
//     });

//     const rates = Object.values(ratesMap).map((rate) => ({
//       rateId: rate.rateId,
//       rateName: rate.rateName,
//       // Round up hours and cost to 2 decimal places
//       hours: Math.ceil(rate.hours * 100) / 100,
//       cost: Math.ceil(rate.cost * 100) / 100,
//     }));

//     return {
//       projectId: project.id,
//       projectName: project.name,
//       // Round up total hours and total cost to 2 decimal places
//       totalHours: Math.ceil(totalHours * 100) / 100,
//       totalCost: Math.ceil(totalCost * 100) / 100,
//       rates,
//     };
//   }
// }
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Invoice, RateDetail } from './invoice.model';

const prisma = new PrismaClient();

@Injectable()
export class InvoiceService {
  async generateInvoiceForProject(
    projectId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Invoice> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        time: {
          where: {
            startTime: { gte: startDate },
            endTime: { lte: endDate },
          },
          include: {
            rate: true, // Ensures that rate information is included in the query
          },
        },
      },
    });

    if (!project) throw new Error('Project not found');

    let totalHours = 0;
    let totalCost = 0;
    const ratesMap: { [key: number]: RateDetail & { ratePerHour: number } } =
      {};

    project.time.forEach((entry) => {
      const hours = entry.totalElapsedTime / 3600000; // Convert milliseconds to hours
      totalHours += hours;
      totalCost += hours * entry.rate.rate;

      if (!ratesMap[entry.rateId]) {
        ratesMap[entry.rateId] = {
          rateId: entry.rateId,
          rateName: entry.rate.name,
          hours: 0,
          cost: 0,
          ratePerHour: entry.rate.rate, // Storing the rate per hour
        };
      }

      ratesMap[entry.rateId].hours += hours;
      ratesMap[entry.rateId].cost += hours * entry.rate.rate;
    });

    const rates = Object.values(ratesMap).map((rate) => ({
      ...rate,
      hours: Math.round(rate.hours * 100) / 100, // Round hours to 2 decimal places
      cost: Math.round(rate.cost * 100) / 100, // Round cost to 2 decimal places
    }));

    return {
      projectId: project.id,
      projectName: project.name,
      totalHours: Math.round(totalHours * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      rates,
    };
  }
}
