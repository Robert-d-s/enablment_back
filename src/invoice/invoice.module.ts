import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceResolver } from './invoice.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [InvoiceService, InvoiceResolver],
  controllers: [],
})
export class InvoiceModule {}
