import { Module } from '@nestjs/common';
import { TimeService } from './time.service';
import { TimeResolver } from './time.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, ConfigModule],
  providers: [TimeService, TimeResolver],
})
export class TimeModule {}
