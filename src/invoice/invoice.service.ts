import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Invoice, RateDetail } from './invoice.model';
import { Prisma } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectPinoLogger() private readonly logger: PinoLogger,
    private prisma: PrismaService,
  ) {}

  async generateInvoiceForProject(
    projectId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Invoice> {
    this.logger.info(
      { projectId, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      `Generating invoice for Project`
    );
    const projectWithTeam = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          select: { id: true, name: true },
        },
      },
    });

    if (!projectWithTeam || !projectWithTeam.team) {
      this.logger.warn({ projectId }, 'Project or its associated Team not found.');
      throw new NotFoundException(
        `Project with ID ${projectId} or its Team not found`,
      );
    }
    const { team, ...project } = projectWithTeam;

    const timeFilter: Prisma.TimeWhereInput = {
      projectId: projectId,
      startTime: { gte: startDate },
      endTime: { lte: endDate },
      rateId: { not: null },
      totalElapsedTime: { gt: 0 },
    };

    try {
      const rateAggregations = await this.prisma.time.groupBy({
        by: ['rateId'],
        where: timeFilter,
        _sum: {
          totalElapsedTime: true,
        },
      });

      if (!rateAggregations || rateAggregations.length === 0) {
        this.logger.info({ projectId, startDate, endDate }, 'No time entries with rates found for Project in the period.');
        return {
          projectId: project.id,
          projectName: project.name,
          teamId: team.id,
          teamName: team.name,
          totalHours: 0,
          totalCost: 0,
          rates: [],
          __typename: 'Invoice',
        };
      }

      const rateIds = rateAggregations.map((agg) => agg.rateId as number);
      const ratesDetailsMap = await this.prisma.rate
        .findMany({
          where: { id: { in: rateIds } },
          select: { id: true, name: true, rate: true },
        })
        .then((rates) => new Map(rates.map((r) => [r.id, r])));

      let grandTotalHours = 0;
      let grandTotalCost = 0;
      const rateDetailsResult: RateDetail[] = [];

      for (const agg of rateAggregations) {
        const rateId = agg.rateId as number;
        const rateInfo = ratesDetailsMap.get(rateId);
        const totalMs = agg._sum.totalElapsedTime ?? 0;

        if (!rateInfo) {
          this.logger.warn({ rateId }, 'Rate info not found, skipping aggregation.');
          continue;
        }

        const hours = totalMs / 3600000;
        const cost = hours * rateInfo.rate;

        grandTotalHours += hours;
        grandTotalCost += cost;

        rateDetailsResult.push({
          rateId: rateInfo.id,
          rateName: rateInfo.name,
          hours: Math.round(hours * 100) / 100,
          cost: Math.round(cost * 100) / 100,
          ratePerHour: rateInfo.rate,
          __typename: 'RateDetail',
        });
      }
      this.logger.info(
        {
          projectId,
          teamName: team.name,
          totalCost: Math.round(grandTotalCost * 100) / 100,
          totalHours: Math.round(grandTotalHours * 100) / 100,
        },
        'Invoice generated successfully',
      );

      return {
        projectId: project.id,
        projectName: project.name,
        teamId: team.id,
        teamName: team.name,
        totalHours: Math.round(grandTotalHours * 100) / 100,
        totalCost: Math.round(grandTotalCost * 100) / 100,
        rates: rateDetailsResult.sort((a, b) =>
          a.rateName.localeCompare(b.rateName),
        ),
        __typename: 'Invoice',
      };
    } catch (error) {
      this.logger.error({ err: error, projectId }, 'Failed to generate invoice');
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to generate invoice for project ${projectId}`,
        error.message,
      );
    }
  }
}
