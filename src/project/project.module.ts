import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectSyncService } from './project-sync.service';
import { ProjectResolver } from './project.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { ConfigModule } from '@nestjs/config';
import { DataLoaderModule } from '../loaders/data-loader.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    ConfigModule,
    DataLoaderModule,
  ],
  providers: [ProjectService, ProjectSyncService, ProjectResolver],
  exports: [ProjectResolver, ProjectSyncService], // Export sync service for dbSynch module
})
export class ProjectModule {}
