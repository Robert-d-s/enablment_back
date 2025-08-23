import { Injectable } from '@nestjs/common';
import {
  ExceptionFactory,
  ResourceConflictException,
} from '../common/exceptions';
import { UserCoreService } from '../user/user-core.service';
import { UserSecurityService } from '../user/services/user-security.service';
import { User, UserRole } from '@prisma/client';
import type { UserProfile } from '../auth';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { TokenBlacklistService } from '../common/services/token-blacklist.service';
import { TokenService, RefreshTokenPayload } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
    private readonly userCoreService: UserCoreService,
    private readonly userSecurityService: UserSecurityService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly tokenService: TokenService,
  ) {}

  async signIn(
    username: string,
    pass: string,
  ): Promise<{
    user: UserProfile;
    accessToken: string;
    refreshToken: string;
  }> {
    this.logger.debug(`Attempting sign in for user: %s`, username);
    try {
      const user = await this.userCoreService.findOne(username);
      if (!user) {
        this.logger.warn('Sign-in failed: User %s not found', username);
        throw ExceptionFactory.invalidCredentials();
      }

      const isMatch = await this.userSecurityService.verifyPassword(
        pass,
        user.password,
      );
      if (!isMatch) {
        this.logger.warn(
          'Sign-in failed: Password mismatch for user %s',
          username,
        );
        throw ExceptionFactory.invalidCredentials();
      }

      const { accessToken, refreshToken } =
        await this.tokenService.generateTokens(user);
      await this.updateRefreshTokenHash(user.id, refreshToken);

      const result = {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        } as UserProfile,
        accessToken,
        refreshToken,
      };
      this.logger.info(
        { userId: user.id, email: user.email },
        'User signed in successfully',
      );
      return result;
    } catch (error) {
      if (error.errorCode) {
        throw error;
      }
      this.logger.error(
        { err: error },
        'An error occurred during sign in for user %s',
        username,
      );
      throw ExceptionFactory.databaseError(
        'user authentication',
        'User',
        error as Error,
      );
    }
  }

  async signUp(email: string, password: string): Promise<User> {
    this.logger.debug('Attempting sign-up for email: %s', email);
    try {
      this.userSecurityService.validateEmail(email);
      this.userSecurityService.validatePassword(password);

      const userCount = await this.userCoreService.count();
      const role = userCount === 0 ? UserRole.ADMIN : UserRole.PENDING;
      this.logger.debug('Determined role for new user %s: %s', email, role);

      const existingUser = await this.userCoreService.findOne(email);
      if (existingUser) {
        this.logger.warn('Sign-up failed: Email %s already exists', email);
        throw new ResourceConflictException('User', 'Email already exists', {
          email,
        });
      }

      const hashedPassword = await this.userSecurityService.hashData(password);
      return this.userCoreService.create(email, hashedPassword, role);
    } catch (error) {
      if (error.errorCode) {
        this.logger.warn(
          { err: error },
          'Sign up validation/conflict error for email %s',
          email,
        );
        throw error;
      }
      this.logger.error(
        { err: error },
        'An unexpected error occurred during sign up for email %s',
        email,
      );
      throw ExceptionFactory.databaseError(
        'user creation',
        'User',
        error as Error,
      );
    }
  }

  async logout(userId: number, accessToken?: string): Promise<boolean> {
    this.logger.info(`Logging out user ${userId}. Clearing token hash.`);

    if (accessToken) {
      const jti = this.tokenService.getAccessTokenJti(accessToken);
      if (jti) {
        const expiresAt = this.tokenService.getTokenExpiry(accessToken);
        if (expiresAt) {
          const ttlMs = Math.max(0, expiresAt - Date.now());
          this.tokenBlacklistService.blacklistToken(jti, { ttlMs });
        } else {
          this.tokenBlacklistService.blacklistToken(jti);
        }
        this.logger.debug({ userId, jti }, 'Access token blacklisted by jti');
      } else {
        this.logger.warn(
          { userId },
          'Failed to extract jti from access token during logout; skipping blacklist',
        );
      }
    }

    await this.userSecurityService.clearRefreshToken(userId);
    return true;
  }

  async refreshToken(
    userId: number,
    rt: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    this.logger.debug(`Attempting token refresh for user ${userId}`);

    // First decode the refresh token to check blacklist
    let refreshPayload: RefreshTokenPayload;
    try {
      refreshPayload = await this.tokenService.verifyRefreshToken(rt);
    } catch (error) {
      this.logger.warn(
        { userId, error: error.message },
        'Refresh token verification failed',
      );
      throw ExceptionFactory.tokenExpired();
    }

    // Check if refresh token is blacklisted
    if (
      refreshPayload.jti &&
      this.tokenBlacklistService.isTokenBlacklisted(refreshPayload.jti)
    ) {
      this.logger.warn(
        { userId, jti: refreshPayload.jti },
        'Attempted refresh with blacklisted token',
      );
      throw ExceptionFactory.tokenExpired();
    }

    const user = await this.userCoreService.findById(userId);

    if (!user || !user.hashedRefreshToken) {
      this.logger.warn(
        `Refresh Denied: User ${userId} not found or no stored hash.`,
      );
      throw ExceptionFactory.tokenExpired();
    }

    const rtMatches = await this.userSecurityService.verifyRefreshToken(
      rt,
      user.hashedRefreshToken,
    );
    if (!rtMatches) {
      this.logger.warn(
        `Refresh Denied: Provided token does not match stored hash for user ${userId}.`,
      );
      throw ExceptionFactory.tokenExpired();
    }
    this.logger.debug(
      `Refresh Granted: Token match successful for user ${userId}.`,
    );

    const { accessToken, refreshToken: newRefreshToken } =
      await this.tokenService.generateTokens(user);

    await this.updateRefreshTokenHash(user.id, newRefreshToken);
    this.logger.debug(
      `Refresh Rotation: Stored new token hash for user ${userId}.`,
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  private async updateRefreshTokenHash(
    userId: number,
    refreshToken: string | null,
  ): Promise<void> {
    const hashedRefreshToken = refreshToken
      ? await this.userSecurityService.hashData(refreshToken)
      : null;

    await this.userSecurityService.updateRefreshTokenHash(
      userId,
      hashedRefreshToken,
    );
    this.logger.debug(`Updated refresh token hash for user ${userId}.`);
  }
}
