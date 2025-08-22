import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UserCoreService } from './user-core.service';
import { UserSecurityService } from './services/user-security.service';
import { UserTeamService } from './services/user-team.service';
import { UserRoleService } from './services/user-role.service';
import { UserResolver } from './user.resolver';
import { UserProjectsResolver } from './resolvers/user-projects.resolver';
import { UserTeamManagementResolver } from './resolvers/user-team-management.resolver';
import { UserRoleManagementResolver } from './resolvers/user-role-management.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { DataLoaderModule } from '../loaders/data-loader.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    DataLoaderModule,
    forwardRef(() => AuthModule),
  ],
  providers: [
    UserResolver,
    UserProjectsResolver,
    UserTeamManagementResolver,
    UserRoleManagementResolver,
    UserCoreService,
    UserSecurityService,
    UserTeamService,
    UserRoleService,
  ],
  exports: [
    UserResolver,
    UserProjectsResolver,
    UserTeamManagementResolver,
    UserRoleManagementResolver,
    UserCoreService,
    UserSecurityService,
    UserTeamService,
    UserRoleService,
  ],
})
export class UserModule {}
