import { Args, Mutation, Query, Resolver, Int } from '@nestjs/graphql';
import { RateService } from './rate.service';
import { Rate, DeleteRateResponse } from './rate.model';
import { RateInputCreate, DeleteRateInput } from './rate.input';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Resolver(() => Rate)
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
    this.logger.info(
      { rateInput: rateInputCreate },
      'Executing createRate mutation',
    );
    return this.rateService.create(
      rateInputCreate.name,
      rateInputCreate.rate,
      rateInputCreate.teamId,
    );
  }
  @Mutation(() => DeleteRateResponse)
  @Roles(UserRole.ADMIN)
  async deleteRate(
    @Args('input') input: DeleteRateInput,
  ): Promise<DeleteRateResponse> {
    this.logger.info({ input }, 'Executing deleteRate mutation');
    const deletedRate = await this.rateService.remove(input.rateId);
    if (!deletedRate) {
      return { id: input.rateId };
    }
    return { id: deletedRate.id };
  }
}
