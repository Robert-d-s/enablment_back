import { Module } from '@nestjs/common';
import { DatabaseSyncService } from './dbSynch.service';
import { DatabaseSyncController } from './dbSynch.controller';
import { TeamModule } from '../team/team.module';

@Module({
  imports: [TeamModule],
  providers: [DatabaseSyncService],
  controllers: [DatabaseSyncController],
  exports: [DatabaseSyncService],
})
export class DatabaseSyncModule {}
