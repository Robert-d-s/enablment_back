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
      // Update the existing entry with the actual endTime and the new totalElapsedTime
      return this.timeService.update(
        existingEntry.id,
        new Date(), // Set to the current time as the endTime
        totalElapsedTime,
      );
    } else {
      // If no existing entry is found, create a new one with the submitted endTime
      // const endTime = new Date(); // Set to the current time as the endTime
      return this.timeService.create(
        startTime,
        projectId,
        userId,
        rateId,
        // endTime,
        new Date(endTime),
        totalElapsedTime,
      );
    }
  }

  @Mutation(() => Time)
  async updateTime(
    @Args('timeInputUpdate') timeInputUpdate: TimeInputUpdate,
  ): Promise<Time> {
    const { id, endTime, totalElapsedTime } = timeInputUpdate;
    return this.timeService.update(
      id,
      endTime ?? new Date(), // If endTime is not provided, use the current time
      totalElapsedTime,
    );
  }

  // @Query(() => Number)
  // async getTotalTimeSpent(
  //   @Args('userId') userId: number,
  //   @Args('projectId') projectId: string,
  //   @Args('date') date: string,
  // ): Promise<number> {
  //   const parsedDate = new Date(date); // Convert the date string to a Date object
  //   return this.timeService.getTotalTimeSpent(userId, projectId, parsedDate);
  // }

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
