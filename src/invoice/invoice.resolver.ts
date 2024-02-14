import { Args, Query, Resolver } from '@nestjs/graphql';
import { InvoiceService } from './invoice.service';
import { Invoice } from './invoice.model';

@Resolver(() => Invoice)
export class InvoiceResolver {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Query(() => Invoice)
  async invoiceForProject(
    @Args('projectId') projectId: string,
    @Args('startDate') startDate: Date,
    @Args('endDate') endDate: Date,
  ): Promise<Invoice> {
    return this.invoiceService.generateInvoiceForProject(
      projectId,
      startDate,
      endDate,
    );
  }
}
