import { Mutation, Resolver } from '@nestjs/graphql';
import { Throttle } from '@nestjs/throttler';
import { DatabaseSyncService } from './dbSynch.service';
import { SyncResponse } from './dto/sync-response';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Resolver()
export class DatabaseSyncResolver {
  constructor(private readonly databaseSyncService: DatabaseSyncService) {}

  @Mutation(() => SyncResponse)
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 1, ttl: 300000 } }) // 1 sync attempt per 5 minutes
  async synchronizeDatabase(): Promise<SyncResponse> {
    try {
      await this.databaseSyncService.synchronizeDatabase();
      return {
        status: 'success',
        message: 'Database synchronization completed successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Synchronization failed: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
