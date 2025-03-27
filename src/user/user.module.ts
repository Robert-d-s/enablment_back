import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { DataLoaderModule } from '../loaders/data-loader.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    PrismaModule,
    ConfigModule,
    DataLoaderModule,
  ],
  providers: [UserResolver, UserService],
  exports: [UserResolver, UserService],
})
export class UserModule {}
