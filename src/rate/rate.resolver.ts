import { Args, Mutation, Query, Resolver, Int } from '@nestjs/graphql';
import { RateService } from './rate.service';
import { Rate } from './rate.model';
import { RateInputCreate } from './rate.input';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Resolver(() => Rate)
@UseGuards(AuthGuard)
export class RateResolver {
  @InjectPinoLogger(RateResolver.name)
  private readonly logger: PinoLogger;
  constructor(private rateService: RateService) {}

  @Query(() => [Rate])
  async rates(@Args('teamId') teamId: string): Promise<Rate[]> {
    this.logger.debug({ teamId }, 'Executing rates query');
    return this.rateService.all(teamId);
  }

  @Mutation(() => Rate)
  @Roles(UserRole.ADMIN)
  async createRate(
    @Args('rateInputCreate') rateInputCreate: RateInputCreate,
  ): Promise<Rate> {
    this.logger.info({ rateInput: rateInputCreate }, 'Executing createRate mutation');
    return this.rateService.create(
      rateInputCreate.name,
      rateInputCreate.rate,
      rateInputCreate.teamId,
    );
  }

  @Mutation(() => Rate)
  @Roles(UserRole.ADMIN)
  async deleteRate(
    @Args('rateId', { type: () => Int }) rateId: number,
  ): Promise<{ id: number }> {
    this.logger.info({ rateId }, 'Executing deleteRate mutation');
    const deletedRate = await this.rateService.remove(rateId);
    if (!deletedRate) {
      return { id: rateId };
    }
    return { id: deletedRate.id };
  }
}
