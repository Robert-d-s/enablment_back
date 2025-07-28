import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserService as UserCoreService } from './user-core.service';
import { UserSecurityService } from './services/user-security.service';
import { UserTeamService } from './services/user-team.service';
import { UserRoleService } from './services/user-role.service';
import { UserResolver } from './user.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { DataLoaderModule } from '../loaders/data-loader.module';

@Module({
  imports: [PrismaModule, ConfigModule, DataLoaderModule],
  providers: [
    UserResolver,
    UserService,
    UserCoreService,
    UserSecurityService,
    UserTeamService,
    UserRoleService,
  ],
  exports: [
    UserResolver,
    UserService,
    UserSecurityService,
    UserTeamService,
    UserRoleService,
  ],
})
export class UserModule {}
