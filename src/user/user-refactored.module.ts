import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { UserSecurityService } from './services/user-security.service';
import { UserTeamService } from './services/user-team.service';
import { UserRoleService } from './services/user-role.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { DataLoaderModule } from '../loaders/data-loader.module';

@Module({
  imports: [PrismaModule, ConfigModule, DataLoaderModule],
  providers: [
    UserResolver,
    UserService,
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
