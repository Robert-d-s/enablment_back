import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { TimeService } from './time.service';
import { Time } from './time.model';
import {
  TimeInputCreate,
  TimeInputUpdate,
  DeleteTimeInput,
} from './time.input';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Resolver(() => Time)
export class TimeResolver {
  constructor(
    @InjectPinoLogger(TimeResolver.name)
    private readonly logger: PinoLogger,
    private readonly timeService: TimeService,
  ) {}

  @Query(() => [Time])
  async times(@Args('projectId') projectId: string): Promise<Time[]> {
    this.logger.debug({ projectId }, 'Executing times query');
    return this.timeService.all(projectId);
  }

  @Mutation(() => Time)
  async createTime(
    @Args('timeInputCreate') timeInputCreate: TimeInputCreate,
  ): Promise<Time> {
    this.logger.info(
      { timeInput: timeInputCreate },
      'Executing createTime mutation',
    );
    return this.timeService.create(
      timeInputCreate.startTime,
      timeInputCreate.projectId,
      timeInputCreate.userId,
      timeInputCreate.rateId,
      timeInputCreate.totalElapsedTime,
    );
  }

  @Mutation(() => Time)
  async updateTime(
    @Args('timeInputUpdate') timeInputUpdate: TimeInputUpdate,
  ): Promise<Time> {
    this.logger.info(
      { timeInput: timeInputUpdate },
      'Executing updateTime mutation',
    );
    const { id, endTime, totalElapsedTime } = timeInputUpdate;
    return this.timeService.update(id, endTime ?? new Date(), totalElapsedTime);
  }

  @Query(() => Number)
  async getTotalTimeSpent(
    @Args('userId') userId: number,
    @Args('projectId') projectId: string,
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
  ): Promise<number> {
    this.logger.debug(
      { userId, projectId, startDate, endDate },
      'Executing getTotalTimeSpent query',
    );
    return this.timeService.getTotalTimeSpent(
      userId,
      projectId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Query(() => Number)
  async getTotalTimeForUserProject(
    @Args('userId') userId: number,
    @Args('projectId') projectId: string,
  ): Promise<number> {
    this.logger.debug(
      { userId, projectId },
      'Executing getTotalTimeForUserProject query',
    );
    return this.timeService.getTotalTimeForUserProject(userId, projectId);
  }

  @Mutation(() => Time)
  async deleteTime(@Args('input') input: DeleteTimeInput): Promise<Time> {
    this.logger.info({ input }, 'Executing deleteTime mutation');
    return this.timeService.remove(input.id);
  }
}
