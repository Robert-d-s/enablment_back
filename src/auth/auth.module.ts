import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
// import { jwtConstants } from './constants';
import { UserModule } from '../user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthResolver } from './auth.resolver';
import { AuthGuard } from './auth.guard';

// Key for metadata to mark routes as public
export const IS_PUBLIC_KEY = 'isPublic';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => UserModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // ✅ Load from env correctly
        signOptions: { expiresIn: '43200s' },
      }),
    }),
  ],
  providers: [
    AuthService,
    AuthResolver,
    AuthGuard, // Provide the guard for injection but don't apply it globally
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, AuthGuard], // Export the guard for use in other modules
})
export class AuthModule {}
