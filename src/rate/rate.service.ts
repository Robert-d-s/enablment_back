import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { Rate } from './rate.model';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

// Prisma error codes as constants
const PRISMA_ERRORS = {
  RECORD_NOT_FOUND: 'P2025',
  UNIQUE_CONSTRAINT_VIOLATION: 'P2002',
  FOREIGN_KEY_CONSTRAINT_VIOLATION: 'P2003',
} as const;

@Injectable()
export class RateService {
  constructor(
    @InjectPinoLogger(RateService.name)
    private readonly logger: PinoLogger,
    private prisma: PrismaService,
  ) {}

  /**
   * Fetches all rates for a specific team
   * @param teamId - The team identifier
   * @returns Promise<Rate[]> - Array of rates for the team
   * @throws BadRequestException if teamId is invalid
   * @throws InternalServerErrorException if database operation fails
   */
  async all(teamId: string): Promise<Rate[]> {
    if (!teamId || typeof teamId !== 'string' || teamId.trim().length === 0) {
      this.logger.warn(
        { teamId },
        'Invalid teamId provided for fetching rates',
      );
      throw new BadRequestException('Valid teamId is required');
    }

    this.logger.debug({ teamId }, 'Fetching all rates for team');

    try {
      const rates = await this.prisma.rate.findMany({
        where: {
          teamId,
        },
      });

      this.logger.debug(
        { teamId, count: rates.length },
        'Successfully fetched rates for team',
      );

      // Convert Prisma rates to GraphQL rates
      return rates.map((rate) => Rate.fromPrisma(rate));
    } catch (err) {
      this.logger.error({ err, teamId }, 'Error fetching rates for team');
      throw new InternalServerErrorException(
        `Failed to fetch rates for team ${teamId}`,
      );
    }
  }

  /**
   * Creates a new rate for a team
   * @param name - The rate name/description
   * @param rate - The hourly rate amount
   * @param teamId - The team identifier
   * @returns Promise<Rate> - The created rate
   * @throws BadRequestException if input validation fails
   * @throws InternalServerErrorException if database operation fails
   */
  async create(name: string, rate: number, teamId: string): Promise<Rate> {
    // Input validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new BadRequestException('Valid rate name is required');
    }

    if (typeof rate !== 'number' || rate < 0 || !Number.isFinite(rate)) {
      throw new BadRequestException(
        'Rate must be a non-negative number in DKK (e.g., 50.00 for 50.00 DKK/hour)',
      );
    }

    if (!teamId || typeof teamId !== 'string' || teamId.trim().length === 0) {
      throw new BadRequestException('Valid teamId is required');
    }

    this.logger.info({ name, rate, teamId }, 'Creating new rate');

    try {
      const newRate = await this.prisma.rate.create({
        data: {
          name: name.trim(),
          rate,
          teamId,
        },
      });

      this.logger.info(
        { rateId: newRate.id, name, rate, teamId },
        'Successfully created rate',
      );

      return Rate.fromPrisma(newRate);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === PRISMA_ERRORS.UNIQUE_CONSTRAINT_VIOLATION
      ) {
        this.logger.warn(
          { name, teamId },
          'Rate with this name already exists for team',
        );
        throw new BadRequestException(
          `Rate with name "${name}" already exists for this team`,
        );
      }

      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === PRISMA_ERRORS.FOREIGN_KEY_CONSTRAINT_VIOLATION
      ) {
        this.logger.warn({ teamId }, 'Team not found for rate creation');
        throw new NotFoundException(`Team with ID ${teamId} not found`);
      }

      this.logger.error({ err, name, rate, teamId }, 'Error creating rate');
      throw new InternalServerErrorException(
        `Failed to create rate: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Removes a rate and nullifies associated time entries
   * @param id - The rate ID to remove
   * @returns Promise<Rate | null> - The deleted rate or null if not found
   * @throws NotFoundException if rate doesn't exist
   * @throws InternalServerErrorException if database operation fails
   */
  async remove(id: number): Promise<Rate | null> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Valid rate ID is required');
    }

    this.logger.info({ rateId: id }, 'Removing rate');
    try {
      return await this.prisma.$transaction(async (tx) => {
        this.logger.debug(
          { rateId: id },
          'Updating associated time entries to nullify rateId',
        );

        // First, get count of affected time entries for logging
        const timeEntryCount = await tx.time.count({
          where: { rateId: id },
        });

        // Update time entries to remove rate association
        await tx.time.updateMany({
          where: { rateId: id },
          data: { rateId: { set: null } },
        });

        // Delete the rate
        const deletedRate = await tx.rate.delete({
          where: { id },
        });

        this.logger.info(
          { rateId: id, affectedTimeEntries: timeEntryCount },
          'Successfully removed rate',
        );

        return Rate.fromPrisma(deletedRate);
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === PRISMA_ERRORS.RECORD_NOT_FOUND
      ) {
        this.logger.warn({ rateId: id }, 'Rate not found for deletion');
        throw new NotFoundException(`Rate with ID ${id} not found`);
      }

      this.logger.error({ err, rateId: id }, 'Error removing rate');
      throw new InternalServerErrorException(
        `Failed to remove rate ${id}: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }
}
