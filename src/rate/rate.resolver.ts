import { Args, Mutation, Query, Resolver, Context } from '@nestjs/graphql';
import { Throttle } from '@nestjs/throttler';
import { RateService } from './rate.service';
import { Rate, DeleteRateResponse } from './rate.model';
import { RateInputCreate, DeleteRateInput } from './rate.input';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { GqlContext } from '../app.module';
import { UnauthorizedException } from '@nestjs/common';

@Resolver(() => Rate)
export class RateResolver {
  @InjectPinoLogger(RateResolver.name)
  private readonly logger: PinoLogger;
  constructor(private rateService: RateService) {}

  @Query(() => [Rate])
  @Roles(UserRole.ADMIN, UserRole.ENABLER, UserRole.COLLABORATOR)
  async rates(
    @Args('teamId') teamId: string,
    @Context() context: GqlContext,
  ): Promise<Rate[]> {
    const currentUser = context.req.user;
    if (!currentUser) throw new UnauthorizedException('No user in request');
    this.logger.debug(
      { teamId, userId: currentUser.id },
      'Executing rates query',
    );
    return this.rateService.all(teamId, currentUser.id, currentUser.role);
  }

  @Mutation(() => Rate)
  @Roles(UserRole.ADMIN, UserRole.ENABLER)
  @Throttle({ default: { limit: 20, ttl: 300000 } }) // 20 rate operations per 5 minutes
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
  @Roles(UserRole.ADMIN, UserRole.ENABLER)
  @Throttle({ default: { limit: 20, ttl: 300000 } }) // 20 rate operations per 5 minutes
  async deleteRate(
    @Args('input') input: DeleteRateInput,
  ): Promise<DeleteRateResponse> {
    this.logger.info({ input }, 'Executing deleteRate mutation');
    const deletedRate = await this.rateService.remove(input.rateId);
    return { id: deletedRate.id };
  }
}
