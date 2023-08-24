import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class InvoiceQueryInput {
  @Field(() => Int, {
    nullable: false,
    description: 'Month of invoice',
  })
  month: number;

  @Field(() => Int, {
    nullable: false,
    description: 'Year of invoice',
  })
  year: number;

  @Field(() => String, {
    nullable: false,
    description: 'Team id for invoice',
  })
  teamId: string;
}
