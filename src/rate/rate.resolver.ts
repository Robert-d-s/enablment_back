import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RateService } from './rate.service';
import { Rate } from './rate.model';
import { RateInputCreate } from './rate.input';

@Resolver()
export class RateResolver {
  constructor(private rateService: RateService) {}

  @Query(() => [Rate])
  async rates(@Args('teamId') teamId: string): Promise<Rate[]> {
    return this.rateService.all(teamId);
  }

  @Mutation(() => Rate)
  async createRate(
    @Args('rateInputCreate') rateInputCreate: RateInputCreate,
  ): Promise<Rate> {
    return this.rateService.create(
      rateInputCreate.name,
      rateInputCreate.rate,
      rateInputCreate.teamId,
    );
  }

  @Mutation(() => Rate)
  async deleteRate(@Args('rateId') rateId: number): Promise<Rate> {
    return this.rateService.remove(rateId);
  }
}
