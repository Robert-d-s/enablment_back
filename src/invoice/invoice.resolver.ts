import { Args, Query, Resolver, Context } from '@nestjs/graphql';
import { UnauthorizedException } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { Invoice } from './invoice.model';
import { InvoiceInput } from './invoice.input';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { GqlContext } from '../app.module';
import type { UserProfile } from '../auth';

@Resolver(() => Invoice)
export class InvoiceResolver {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Query(() => Invoice)
  @Roles(UserRole.ADMIN, UserRole.ENABLER)
  async invoiceForProject(
    @Args('input') input: InvoiceInput,
    @Context() context: GqlContext,
  ): Promise<Invoice> {
    const user = context.req.user;
    if (!user) throw new UnauthorizedException('No user in request');
    const currentUser: UserProfile = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    return this.invoiceService.generateInvoiceForProject(
      input.projectId,
      input.startDate,
      input.endDate,
      currentUser,
    );
  }
}
