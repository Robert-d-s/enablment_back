import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsString } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class InvoiceInput {
  @Field(() => String, {
    description: 'Project id for invoice',
  })
  @IsString()
  projectId: string;

  @Field(() => Date, {
    description: 'Start date for invoice period',
  })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @Field(() => Date, {
    description: 'End date for invoice period',
  })
  @IsDate()
  @Type(() => Date)
  endDate: Date;
}
