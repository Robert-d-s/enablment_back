import { Args, Query, Resolver } from '@nestjs/graphql';
import { InvoiceService } from './invoice.service';
import { Invoice } from './invoice.model';
import { InvoiceInput } from './invoice.input';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';

@Resolver(() => Invoice)
@UseGuards(AuthGuard)
export class InvoiceResolver {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Query(() => Invoice)
  async invoiceForProject(
    @Args('input') input: InvoiceInput,
  ): Promise<Invoice> {
    return this.invoiceService.generateInvoiceForProject(
      input.projectId,
      input.startDate,
      input.endDate,
    );
  }
}
