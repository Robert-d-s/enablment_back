import { Field, Int, ObjectType, Float } from '@nestjs/graphql';

@ObjectType()
export class InvoiceRate {
  @Field(() => Float)
  hours: number;

  @Field(() => Float)
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

  @Field(() => Float)
  totalHours: number;

  @Field(() => Float)
  totalCost: number;

  @Field(() => [InvoiceRate])
  rates: InvoiceRate[];
}
