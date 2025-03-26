import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { TimeService } from './time.service';
import { Time } from './time.model';
import { TimeInputCreate, TimeInputUpdate } from './time.input';

@Resolver(() => Time)
export class TimeResolver {
  constructor(private readonly timeService: TimeService) {}

  @Query(() => [Time])
  async times(@Args('projectId') projectId: string): Promise<Time[]> {
    return this.timeService.all(projectId);
  }

  @Mutation(() => Time)
  async createTime(
    @Args('timeInputCreate') timeInputCreate: TimeInputCreate,
  ): Promise<Time> {
    console.log(
      'Backend Resolver - Received Start Time:',
      timeInputCreate.startTime,
    );
    console.log(
      'Backend Resolver - Received End Time:',
      timeInputCreate.endTime,
    );
    const { startTime, projectId, userId, rateId, totalElapsedTime, endTime } =
      timeInputCreate;

    // Find an existing entry
    const existingEntry = await this.timeService.findExistingEntry(
      startTime,
      userId,
      projectId,
      rateId,
    );

    if (existingEntry) {
      return this.timeService.update(
        existingEntry.id,
        new Date(),
        totalElapsedTime,
      );
    } else {
      return this.timeService.create(
        startTime,
        projectId,
        userId,
        rateId,
        endTime ? new Date(endTime) : new Date(),
        totalElapsedTime,
      );
    }
  }

  @Mutation(() => Time)
  async updateTime(
    @Args('timeInputUpdate') timeInputUpdate: TimeInputUpdate,
  ): Promise<Time> {
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
    return this.timeService.getTotalTimeForUserProject(userId, projectId);
  }

  @Mutation(() => Time)
  async deleteTime(@Args('id') id: number): Promise<Time> {
    return this.timeService.remove(id);
  }
}
