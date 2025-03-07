import { Module } from '@nestjs/common';
import { DatabaseSyncService } from './dbSynch.service';
import { DatabaseSyncController } from './dbSynch.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [DatabaseSyncService],
  controllers: [DatabaseSyncController],
  exports: [DatabaseSyncService],
})
export class DatabaseSyncModule {}
