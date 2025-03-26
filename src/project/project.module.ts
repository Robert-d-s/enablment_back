import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectResolver } from './project.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, ConfigModule],
  providers: [ProjectService, ProjectResolver],
  exports: [ProjectResolver],
})
export class ProjectModule {}
