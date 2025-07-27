import { Args, Mutation, Query, Resolver, Context } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { UserProfileDto } from './dto/user-profile.dto';
import { SignInInput } from './dto/sign-in.input';
import { SignUpInput } from './dto/sign-up.input';
import { AuthResponse } from './dto/auth-response';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { LogoutResponse } from './dto/logout-response';
import { GqlContext } from '../app.module';
import { Public } from './public.decorator';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenResponse } from './dto/refresh-token-response';
import { UserRole } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Resolver()
export class AuthResolver {
  constructor(
    @InjectPinoLogger(AuthResolver.name) private readonly logger: PinoLogger,
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

  @Mutation(() => LogoutResponse)
  @UseGuards(AuthGuard)
  async logout(
    @CurrentUser() user: UserProfileDto,
    @Context() context: GqlContext,
  ): Promise<LogoutResponse> {
    try {
      await this.authService.logout(user.id);
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
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: UserProfileDto): Promise<UserProfileDto> {
    this.logger.debug({ userId: user.id }, 'Executing "me" query');
    return user;
  }
}
