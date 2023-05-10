import { Field, ObjectType, Int } from "@nestjs/graphql";
import { Time as TimeClient } from '@prisma/client';

@ObjectType()
export class Time implements TimeClient {

    @Field(() => Int)
    id: number;

    @Field(() => Date)
    startTime: Date;

    @Field(() => Date, { nullable: true })
    endTime: Date | null;

    @Field(() => Int)
    userId: number;

    @Field(() => String)
    projectId: string;

    @Field(() => Int)
    rateId: number;
}
