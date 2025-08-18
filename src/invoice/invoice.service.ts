import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Invoice, RateDetail } from './invoice.model';
import { Prisma, UserRole } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { User } from '../user/user.model';

// Constants for time calculations
const MS_PER_HOUR = 60 * 60 * 1000; // 3,600,000 milliseconds in an hour
const DECIMAL_PLACES = 100; // For rounding financial calculations to 2 decimal places

@Injectable()
export class InvoiceService {
  constructor(
    @InjectPinoLogger() private readonly logger: PinoLogger,
    private prisma: PrismaService,
  ) {}

  /**
   * Validates that the user has access to the project's team
   * Admin users have access to all projects, others need team membership
   */
  private async validateUserTeamAccess(
    userId: number,
    teamId: string,
    userRole: UserRole,
  ): Promise<void> {
    // Admin users have access to all teams
    if (userRole === UserRole.ADMIN) {
      return;
    }

    // Check if user is a member of the project's team
    const userTeam = await this.prisma.userTeam.findUnique({
      where: {
        userId_teamId: {
          userId: userId,
          teamId: teamId,
        },
      },
    });

    if (!userTeam) {
      throw new ForbiddenException(
        `Access denied. You are not a member of the team associated with this project.`,
      );
    }
  }

  /**
   * Validates input parameters for invoice generation
   */
  private validateInvoiceInput(
    projectId: string,
    startDate: Date,
    endDate: Date,
  ): void {
    if (!projectId?.trim()) {
      throw new NotFoundException('Project ID is required');
    }

    if (startDate >= endDate) {
      throw new InternalServerErrorException(
        'Start date must be before end date',
      );
    }

    // Check for reasonable date ranges (not more than 1 year)
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > oneYear) {
      throw new InternalServerErrorException(
        'Date range cannot exceed one year',
      );
    }
  }

  /**
   * Calculates hours and cost for a time aggregation with proper precision handling
   * Note: rates are now stored as Decimal in DKK in the database (e.g., 50.00 = 50.00 DKK/hour)
   */
  private calculateRateDetail(
    rateAggregation: {
      rateId: number | null;
      _sum: { totalElapsedTime: number | null };
    },
    rateInfo: { id: number; name: string; rate: number },
  ): { hours: number; cost: number; rateDetail: RateDetail } {
    const totalMs = rateAggregation._sum.totalElapsedTime ?? 0;
    const hours = totalMs / MS_PER_HOUR;

    // Rate is already in DKK, no conversion needed
    const ratePerHourInDKK = rateInfo.rate;

    // Calculate cost and round to avoid floating point precision issues
    const cost =
      Math.round(hours * ratePerHourInDKK * DECIMAL_PLACES) / DECIMAL_PLACES;

    const rateDetail: RateDetail = {
      rateId: rateInfo.id,
      rateName: rateInfo.name,
      hours: Math.round(hours * DECIMAL_PLACES) / DECIMAL_PLACES,
      cost: cost,
      ratePerHour: ratePerHourInDKK, // Return rate in DKK for display
      __typename: 'RateDetail',
    };

    return { hours, cost, rateDetail };
  }

  /**
   * Creates an empty invoice for when no billable time is found
   */
  private createEmptyInvoice(
    project: { id: string; name: string },
    team: { id: string; name: string },
  ): Invoice {
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

  /**
   * Builds the final invoice object with proper rounding
   */
  private buildInvoice(
    project: { id: string; name: string },
    team: { id: string; name: string },
    grandTotalHours: number,
    grandTotalCost: number,
    rateDetailsResult: RateDetail[],
  ): Invoice {
    return {
      projectId: project.id,
      projectName: project.name,
      teamId: team.id,
      teamName: team.name,
      totalHours: Math.round(grandTotalHours * DECIMAL_PLACES) / DECIMAL_PLACES,
      totalCost: Math.round(grandTotalCost * DECIMAL_PLACES) / DECIMAL_PLACES,
      rates: rateDetailsResult.sort((a, b) =>
        a.rateName.localeCompare(b.rateName),
      ),
      __typename: 'Invoice',
    };
  }

  /**
   * Generates a detailed invoice for a project within a specified date range.
   *
   * This method calculates billable hours and costs based on time entries with
   * associated rates. It handles overlapping time periods correctly and provides
   * detailed breakdown by rate type.
   *
   * Security: Validates that the user has access to the project's team.
   * Admin users have access to all projects, other users must be team members.
   *
   * @param projectId - The unique identifier of the project
   * @param startDate - Start date of the billing period (inclusive)
   * @param endDate - End date of the billing period (inclusive)
   * @param currentUser - The authenticated user requesting the invoice
   * @returns Promise<Invoice> - Complete invoice with totals and rate breakdown
   *
   * @throws NotFoundException - When project or team is not found
   * @throws ForbiddenException - When user lacks access to the project's team
   * @throws InternalServerErrorException - For validation errors or data integrity issues
   *
   * @example
   * ```typescript
   * const invoice = await invoiceService.generateInvoiceForProject(
   *   'project-123',
   *   new Date('2024-01-01'),
   *   new Date('2024-01-31'),
   *   currentUser
   * );
   * ```
   */
  async generateInvoiceForProject(
    projectId: string,
    startDate: Date,
    endDate: Date,
    currentUser: User,
  ): Promise<Invoice> {
    // Validate inputs first
    this.validateInvoiceInput(projectId, startDate, endDate);
    this.logger.info(
      {
        projectId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      `Generating invoice for Project`,
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
      this.logger.warn(
        { projectId },
        'Project or its associated Team not found.',
      );
      throw new NotFoundException(
        `Project with ID ${projectId} or its Team not found`,
      );
    }
    const { team, ...project } = projectWithTeam;

    // Validate that the user has access to this project's team
    await this.validateUserTeamAccess(
      currentUser.id,
      team.id,
      currentUser.role,
    );

    // Fix date filtering to include overlapping time entries
    const timeFilter: Prisma.TimeWhereInput = {
      projectId: projectId,
      OR: [
        // Entry starts within the period
        { startTime: { gte: startDate, lte: endDate } },
        // Entry ends within the period
        { endTime: { gte: startDate, lte: endDate } },
        // Entry spans the entire period
        {
          AND: [
            { startTime: { lte: startDate } },
            { endTime: { gte: endDate } },
          ],
        },
      ],
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
        this.logger.info(
          { projectId, startDate, endDate },
          'No time entries with rates found for Project in the period.',
        );
        return this.createEmptyInvoice(project, team);
      }

      const rateIds = rateAggregations.map((agg) => agg.rateId as number);
      // Performance optimization: Fetch all required rates in a single query
      // rather than individual lookups, and use Map for O(1) access
      const ratesDetailsMap = await this.prisma.rate
        .findMany({
          where: { id: { in: rateIds } },
          select: { id: true, name: true, rate: true },
        })
        .then(
          (rates) =>
            new Map(
              rates.map((r) => [
                r.id,
                {
                  id: r.id,
                  name: r.name,
                  rate: r.rate.toNumber(), // Convert Decimal to number
                },
              ]),
            ),
        );

      let grandTotalHours = 0;
      let grandTotalCost = 0;
      const rateDetailsResult: RateDetail[] = [];

      for (const agg of rateAggregations) {
        const rateId = agg.rateId as number;
        const rateInfo = ratesDetailsMap.get(rateId);

        if (!rateInfo) {
          this.logger.error(
            { rateId, projectId },
            'Rate info not found for time entries - data integrity issue',
          );
          throw new InternalServerErrorException(
            `Rate with ID ${rateId} not found for project ${projectId}. This indicates a data integrity issue.`,
          );
        }

        const { hours, cost, rateDetail } = this.calculateRateDetail(
          agg,
          rateInfo,
        );

        grandTotalHours += hours;
        grandTotalCost += cost;
        rateDetailsResult.push(rateDetail);
      }
      this.logger.info(
        {
          projectId,
          teamName: team.name,
          totalCost:
            Math.round(grandTotalCost * DECIMAL_PLACES) / DECIMAL_PLACES,
          totalHours:
            Math.round(grandTotalHours * DECIMAL_PLACES) / DECIMAL_PLACES,
        },
        'Invoice generated successfully',
      );

      return this.buildInvoice(
        project,
        team,
        grandTotalHours,
        grandTotalCost,
        rateDetailsResult,
      );
    } catch (error) {
      this.logger.error(
        {
          err: error,
          projectId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        'Failed to generate invoice',
      );

      // Re-throw known exceptions without wrapping
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      // Wrap unknown errors with context
      throw new InternalServerErrorException(
        `Failed to generate invoice for project ${projectId}: ${error.message}`,
        {
          cause: error,
          description: 'Unexpected error during invoice generation',
        },
      );
    }
  }
}
