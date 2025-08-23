import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  PASSWORD_REGEX,
  PASSWORD_ERROR_MESSAGE,
} from '../../auth/constants/password.constants';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class UserSecurityService {
  constructor(
    @InjectPinoLogger(UserSecurityService.name)
    private readonly logger: PinoLogger,
    private prisma: PrismaService,
  ) {}

  async hashData(data: string): Promise<string> {
    return bcrypt.hash(data, BCRYPT_SALT_ROUNDS);
  }

  async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async verifyRefreshToken(
    providedToken: string,
    hashedToken: string,
  ): Promise<boolean> {
    return bcrypt.compare(providedToken, hashedToken);
  }

  async updateRefreshTokenHash(
    userId: number,
    hashedRefreshToken: string | null,
  ): Promise<void> {
    this.logger.debug(`Updating refresh token hash for user ${userId}`);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        hashedRefreshToken: hashedRefreshToken,
      },
    });
  }

  async clearRefreshToken(userId: number): Promise<void> {
    this.logger.debug(`Clearing refresh token for user ${userId}`);
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        hashedRefreshToken: { not: null },
      },
      data: {
        hashedRefreshToken: null,
      },
    });
  }

  async clearAllRefreshTokens(): Promise<number> {
    this.logger.info('Clearing all refresh tokens');
    const result = await this.prisma.user.updateMany({
      where: {
        hashedRefreshToken: { not: null },
      },
      data: {
        hashedRefreshToken: null,
      },
    });

    this.logger.info(`Cleared refresh tokens for ${result.count} users`);
    return result.count;
  }

  validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }
  }

  validatePassword(password: string): void {
    if (!password) {
      throw new BadRequestException('Password is required');
    }

    // Use the same regex pattern as frontend and DTO validation for consistency
    if (!PASSWORD_REGEX.test(password)) {
      throw new BadRequestException(PASSWORD_ERROR_MESSAGE);
    }
  }
}
