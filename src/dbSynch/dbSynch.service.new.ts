import { Injectable } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { PrismaService } from '../prisma/prisma.service';
import { ExceptionFactory } from '../common/exceptions';
import {
  TeamSyncService,
  ProjectSyncService,
  IssueSyncService,
  CleanupSyncService,
} from './services';

@Injectable()
export class DatabaseSyncService {
  constructor(
    @InjectPinoLogger(DatabaseSyncService.name)
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    private readonly teamSyncService: TeamSyncService,
    private readonly projectSyncService: ProjectSyncService,
    private readonly issueSyncService: IssueSyncService,
    private readonly cleanupSyncService: CleanupSyncService,
  ) {}

  async synchronizeDatabase(): Promise<void> {
    this.logger.info('Starting comprehensive database synchronization');
    try {
      await this.prisma.$transaction(async (tx) => {
        await this.teamSyncService.synchronize(tx);
        await this.projectSyncService.synchronize(tx);
        await this.issueSyncService.synchronize(tx);
        await this.cleanupSyncService.synchronize(tx);
      });
      this.logger.info('Database synchronization completed successfully');
    } catch (error) {
      this.logger.error({ err: error }, 'Database synchronization failed');
      throw ExceptionFactory.externalServiceError(
        'Linear',
        'database synchronization',
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async synchronizeTeamsOnly(): Promise<void> {
    this.logger.info('Starting teams-only synchronization');

    try {
      await this.prisma.$transaction(async (tx) => {
        await this.teamSyncService.synchronize(tx);
      });

      this.logger.info('Teams synchronization completed successfully');
    } catch (error) {
      this.logger.error({ err: error }, 'Teams synchronization failed');
      throw ExceptionFactory.databaseError(
        'teams synchronization',
        'Team',
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
