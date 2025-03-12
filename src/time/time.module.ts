import { Module } from '@nestjs/common';
import { TimeService } from './time.service';
import { TimeResolver } from './time.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TimeService, TimeResolver],
})
export class TimeModule {}
