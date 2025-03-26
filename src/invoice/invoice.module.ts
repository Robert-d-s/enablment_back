import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceResolver } from './invoice.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, ConfigModule],
  providers: [InvoiceService, InvoiceResolver],
  controllers: [],
})
export class InvoiceModule {}
