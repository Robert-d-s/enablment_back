import { Args, Query, Resolver } from '@nestjs/graphql';
import { Invoice } from './invoice.model';
import { InvoiceService } from './invoice.service';
import { InvoiceQueryInput } from './invoice.input'

@Resolver(() => Invoice)
export class InvoiceResolver {
    constructor(private invocieService: InvoiceService) {}

    @Query(() => [Invoice])
    async invoices(
        @Args('InvoiceQueryInput') invoiceQueryInput: InvoiceQueryInput
    ): Promise<Invoice[]> {
        return this.invocieService.generateInvoice(invoiceQueryInput.teamId, invoiceQueryInput.month, invoiceQueryInput.year) as any
    }
}
