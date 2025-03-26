import { Module } from '@nestjs/common';
import { DatabaseSyncService } from './dbSynch.service';
import { DatabaseSyncController } from './dbSynch.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [HttpModule, ConfigModule, PrismaModule],
  providers: [DatabaseSyncService],
  controllers: [DatabaseSyncController],
  exports: [DatabaseSyncService],
})
export class DatabaseSyncModule {}
