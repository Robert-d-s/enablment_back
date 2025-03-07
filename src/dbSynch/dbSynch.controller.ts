import { Controller, Get, HttpCode, Logger } from '@nestjs/common';
import { DatabaseSyncService } from './dbSynch.service';

@Controller('database-sync')
export class DatabaseSyncController {
  private readonly logger = new Logger(DatabaseSyncController.name);

  constructor(private readonly databaseSyncService: DatabaseSyncService) {}

  @Get('/full')
  @HttpCode(200)
  async synchronizeDatabase() {
    this.logger.log('Full database synchronization requested');
    try {
      await this.databaseSyncService.synchronizeDatabase();
      return {
        status: 'success',
        message: 'Database synchronization completed successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Synchronization failed: ${error.message}`);
      return {
        status: 'error',
        message: `Synchronization failed: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
