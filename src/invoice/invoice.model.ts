import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class InvoiceRate {
  @Field(() => Int)
  hours: number;

  @Field(() => Int)
  cost: number;

  @Field(() => String)
  rateName: string;
}

@ObjectType()
export class Invoice {
  @Field(() => String)
  projectId: string;

  @Field(() => String)
  projectName: string;

  @Field(() => Int)
  totalHours: number;

  @Field(() => Int)
  totalCost: number;

  @Field(() => [InvoiceRate])
  rates: InvoiceRate[];
}
