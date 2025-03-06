import { Controller, Get, HttpCode, Logger } from '@nestjs/common';
import { DatabaseSyncService } from './dbSynch.service';

@Controller('database-sync')
export class DatabaseSyncController {
  private readonly logger = new Logger(DatabaseSyncController.name);

  constructor(private readonly databaseSyncService: DatabaseSyncService) {}

  @Get('/full')
  @HttpCode(200)
  async synchronizeDatabase() {
    this.logger.log('Database synchronization requested');
    await this.databaseSyncService.synchronizeDatabase();
    return { message: 'Database synchronization completed successfully' };
  }
}
