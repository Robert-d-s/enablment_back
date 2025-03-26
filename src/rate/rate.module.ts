import { Module } from '@nestjs/common';
import { RateService } from './rate.service';
import { RateResolver } from './rate.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, ConfigModule],
  providers: [RateService, RateResolver],
})
export class RateModule {}
