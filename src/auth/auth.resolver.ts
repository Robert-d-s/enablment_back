// NestJS Core
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';

// Third-party packages
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

// Internal modules
import { GqlContext } from '../app.module';

// Local services and decorators
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

// DTOs and types
import { AuthResponse } from './dto/auth-response';
import { LogoutResponse } from './dto/logout-response';
import { RefreshTokenResponse } from './dto/refresh-token-response';
import { SignInInput } from './dto/sign-in.input';
import { SignUpInput } from './dto/sign-up.input';
import { UserProfileDto } from './dto/user-profile.dto';

@Resolver()
export class AuthResolver {
  constructor(
    @InjectPinoLogger(AuthResolver.name)
    private readonly logger: PinoLogger,
    private authService: AuthService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private setRefreshTokenCookie(context: GqlContext, token: string): void {
    if (!context?.res) {
      this.logger.error(
        'Response object not found in context, cannot set refresh token cookie.',
      );
      return;
    }
    const refreshExpirationDays = parseInt(
      this.configService
        .get<string>('JWT_REFRESH_EXPIRATION')
        ?.replace('d', '') || '7',
      10,
    );
    const maxAgeMs = refreshExpirationDays * 24 * 60 * 60 * 1000;

    context.res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
      maxAge: maxAgeMs,
    });
    this.logger.debug('Refresh token cookie set on path /.');
  }

  private clearRefreshTokenCookie(context: GqlContext): void {
    if (!context?.res) {
      this.logger.debug(
        'Response object not found in context, cannot clear refresh token cookie.',
      );
      return;
    }
    context.res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });
    this.logger.debug('Refresh token cookie cleared.');
  }

  @Public()
  @Mutation(() => AuthResponse)
  async login(
    @Context() context: GqlContext,
    @Args('input') signInInput: SignInInput,
  ): Promise<Omit<AuthResponse, 'refresh_token'>> {
    const emailToUse = signInInput.email;
    const passwordToUse = signInInput.password;
    const { user, accessToken, refreshToken } = await this.authService.signIn(
      emailToUse,
      passwordToUse,
    );

    this.setRefreshTokenCookie(context, refreshToken);

    const result = {
      accessToken: accessToken,
      user: UserProfileDto.fromUser(user),
    };
    this.logger.info({ user: result.user }, 'AuthResolver.login successful');
    return result;
  }

  @Public()
  @Mutation(() => RefreshTokenResponse)
  async refreshToken(
    @Context() context: GqlContext,
  ): Promise<RefreshTokenResponse> {
    const oldRefreshToken = context.req?.cookies?.['refresh_token'];
    this.logger.debug(
      'Refresh endpoint called. Cookie received: %s',
      oldRefreshToken ? 'Yes' : 'No',
    );

    if (!oldRefreshToken) {
      throw new UnauthorizedException('Refresh token not found.');
    }

    try {
      const decoded = await this.jwtService.verifyAsync<{ sub: number }>(
        oldRefreshToken,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );
      const userId = decoded.sub;

      const { accessToken, refreshToken: newRefreshToken } =
        await this.authService.refreshToken(userId, oldRefreshToken);

      this.setRefreshTokenCookie(context, newRefreshToken);

      return { accessToken: accessToken };
    } catch (err) {
      this.logger.error({ err }, 'Refresh token validation or rotation failed');
      this.clearRefreshTokenCookie(context);
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
  }

  private extractTokenFromRequest(context: GqlContext): string | undefined {
    const authHeader = context.req?.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return undefined;
  }

  @Mutation(() => LogoutResponse)
  async logout(@Context() context: GqlContext): Promise<LogoutResponse> {
    const user = context.req.user;
    if (!user) throw new UnauthorizedException('No user in request');
    const token = this.extractTokenFromRequest(context);

    try {
      await this.authService.logout(user.id, token);
    } catch (error) {
      this.logger.error(
        { err: error, userId: user.id },
        'Error during server-side logout',
      );
    }

    this.clearRefreshTokenCookie(context);
    this.logger.info({ userId: user.id }, 'User logged out');
    return { success: true };
  }

  @Public()
  @Mutation(() => AuthResponse)
  async signup(
    @Context() context: GqlContext,
    @Args('input') signUpInput: SignUpInput,
  ): Promise<Omit<AuthResponse, 'refresh_token'>> {
    const emailToUse = signUpInput.email;
    const passwordToUse = signUpInput.password;
    const createdUser = await this.authService.signUp(
      emailToUse,
      passwordToUse,
    );

    const { accessToken, refreshToken } = await this.authService.signIn(
      emailToUse,
      passwordToUse,
    );
    this.setRefreshTokenCookie(context, refreshToken);
    this.logger.info(
      { userId: createdUser.id, email: createdUser.email },
      'User signup successful',
    );
    return {
      accessToken: accessToken,
      user: UserProfileDto.fromUser(createdUser),
    };
  }

  @Query(() => UserProfileDto)
  async me(@Context() context: GqlContext): Promise<UserProfileDto> {
    const user = context.req.user;
    if (!user) throw new UnauthorizedException('No user in request');
    this.logger.debug({ userId: user.id }, 'Executing "me" query');
    return user;
  }
}
