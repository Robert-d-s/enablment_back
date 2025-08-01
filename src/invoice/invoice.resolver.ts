import { Args, Query, Resolver, Context } from '@nestjs/graphql';
import { InvoiceService } from './invoice.service';
import { Invoice } from './invoice.model';
import { InvoiceInput } from './invoice.input';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { GqlContext } from '../app.module';
import { User } from '../user/user.model';

@Resolver(() => Invoice)
export class InvoiceResolver {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Query(() => Invoice)
  @Roles(UserRole.ADMIN, UserRole.ENABLER)
  async invoiceForProject(
    @Args('input') input: InvoiceInput,
    @Context() context: GqlContext,
  ): Promise<Invoice> {
    const currentUser = context.req.user as User;
    return this.invoiceService.generateInvoiceForProject(
      input.projectId,
      input.startDate,
      input.endDate,
      currentUser,
    );
  }
}
