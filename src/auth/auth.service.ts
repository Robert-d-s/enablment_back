import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { TokenBlacklistService } from './token-blacklist.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectPinoLogger(AuthService.name) private readonly logger: PinoLogger,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly tokenService: TokenService,
  ) {}

  private async updateRefreshTokenHash(
    userId: number,
    refreshToken: string | null,
  ): Promise<void> {
    const hashedRefreshToken = refreshToken
      ? await this.userService.hashData(refreshToken)
      : null;

    await this.userService.updateRefreshTokenHash(userId, hashedRefreshToken);
    this.logger.debug(`Updated refresh token hash for user ${userId}.`);
  }

  async signIn(
    username: string,
    pass: string,
  ): Promise<{
    user: Pick<User, 'id' | 'email' | 'role'>;
    accessToken: string;
    refreshToken: string;
  }> {
    this.logger.debug(`Attempting sign in for user: %s`, username);
    try {
      const user = await this.userService.findOne(username);
      if (!user) {
        this.logger.warn('Sign-in failed: User %s not found', username);
        throw new UnauthorizedException('Invalid email or password');
      }

      const isMatch = await bcrypt.compare(pass, user.password);
      if (!isMatch) {
        this.logger.warn(
          'Sign-in failed: Password mismatch for user %s',
          username,
        );
        throw new UnauthorizedException('Invalid email or password');
      }

      const { accessToken, refreshToken } =
        await this.tokenService.generateTokens(user);
      await this.updateRefreshTokenHash(user.id, refreshToken);

      const result = {
        user: { id: user.id, email: user.email, role: user.role },
        accessToken,
        refreshToken,
      };
      this.logger.info(
        { userId: user.id, email: user.email },
        'User signed in successfully',
      );
      return result;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        { err: error },
        'An error occurred during sign in for user %s',
        username,
      );
      throw new InternalServerErrorException(
        'An error occurred during sign in',
      );
    }
  }

  async refreshToken(
    userId: number,
    rt: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    this.logger.debug(`Attempting token refresh for user ${userId}`);
    const user = await this.userService.findById(userId);

    if (!user || !user.hashedRefreshToken) {
      this.logger.warn(
        `Refresh Denied: User ${userId} not found or no stored hash.`,
      );
      throw new UnauthorizedException('Access Denied');
    }

    // Compare the provided token (rt) with the stored hash
    const rtMatches = await bcrypt.compare(rt, user.hashedRefreshToken);
    if (!rtMatches) {
      this.logger.warn(
        `Refresh Denied: Provided token does not match stored hash for user ${userId}.`,
      );
      throw new UnauthorizedException('Access Denied');
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

  async logout(userId: number, accessToken?: string): Promise<boolean> {
    this.logger.info(`Logging out user ${userId}. Clearing token hash.`);

    // Blacklist the current access token if provided
    if (accessToken) {
      this.tokenBlacklistService.blacklistToken(accessToken);
      this.logger.debug({ userId }, 'Access token blacklisted');
    }

    // Clear refresh token from database
    await this.userService.clearRefreshToken(userId);
    return true;
  }

  async signUp(email: string, password: string): Promise<User> {
    this.logger.debug('Attempting sign-up for email: %s', email);
    try {
      this.validateEmail(email);
      this.validatePassword(password);

      const userCount = await this.userService.count();
      const role = userCount === 0 ? UserRole.ADMIN : UserRole.PENDING;
      this.logger.debug('Determined role for new user %s: %s', email, role);

      const existingUser = await this.userService.findOne(email);
      if (existingUser) {
        this.logger.warn('Sign-up failed: Email %s already exists', email);
        throw new ConflictException('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      return this.userService.create(email, hashedPassword, role);
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
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
      throw new InternalServerErrorException(
        'An error occurred during sign up',
      );
    }
  }

  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }
  }

  private validatePassword(password: string): void {
    if (!password) {
      throw new BadRequestException('Password is required');
    }

    if (password.length < 6) {
      throw new BadRequestException(
        'Password must be at least 6 characters long',
      );
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!(hasUpperCase && hasLowerCase && (hasNumbers || hasSpecialChar))) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter, one lowercase letter, and either a number or special character',
      );
    }
  }
}
