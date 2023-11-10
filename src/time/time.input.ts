import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class TimeInputCreate {
  @Field(() => Date, {
    nullable: false,
    description: 'Start time',
  })
  startTime: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'End time',
  })
  endTime?: Date;

  @Field(() => String, {
    nullable: false,
    description: 'Project ID',
  })
  projectId: string;

  @Field(() => Number, {
    nullable: false,
    description: 'User ID',
  })
  userId: number;

  @Field(() => Number, {
    nullable: false,
    description: 'Rate ID',
  })
  rateId: number;

  @Field(() => Number, {
    nullable: false, // or false, depending on whether it should be optional or not
    description: 'Total Elapsed Time',
  })
  totalElapsedTime: number; // or just totalElapsedTime: number; if it's required
}

@InputType()
export class TimeInputUpdate {
  @Field(() => Number, {
    nullable: false,
    description: 'Time entry ID',
  })
  id: number;

  // @Field(() => Date, {
  //   nullable: true,
  //   description: 'Start time',
  // })
  // startTime?: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'End time',
  })
  endTime?: Date;

  // @Field(() => String, {
  //   nullable: true,
  //   description: 'Project ID',
  // })
  // projectId?: string;

  // @Field(() => Number, {
  //   nullable: true,
  //   description: 'User ID',
  // })
  // userId?: number;

  // @Field(() => Number, {
  //   nullable: true,
  //   description: 'Rate ID',
  // })
  // rateId?: number;

  @Field(() => Number, {
    nullable: false, // or false, depending on whether it should be optional or not
    description: 'Total Elapsed Time',
  })
  totalElapsedTime: number; // or just totalElapsedTime: number; if it's required
}
