import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '@prisma/client';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessTokenPayload = {
      email: user.email,
      sub: user.id,
      id: user.id,
      role: user.role,
    };
    const refreshTokenPayload = { sub: user.id };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn:
          this.configService.get<string>('JWT_ACCESS_EXPIRATION') ?? '15m',
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn:
          this.configService.get<string>('JWT_REFRESH_EXPIRATION') ?? '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async hashData(data: string): Promise<string> {
    return bcrypt.hash(data, 10);
  }

  private async updateRefreshTokenHash(
    userId: number,
    refreshToken: string | null,
  ): Promise<void> {
    const hashedRefreshToken = refreshToken
      ? await this.hashData(refreshToken)
      : null;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        hashedRefreshToken: hashedRefreshToken,
      },
    });
    console.log(`Updated refresh token hash for user ${userId}.`);
  }

  async signIn(
    username: string,
    pass: string,
  ): Promise<{
    user: Pick<User, 'id' | 'email' | 'role'>;
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const user = await this.userService.findOne(username);

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isMatch = await bcrypt.compare(pass, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const { accessToken, refreshToken } = await this.generateTokens(user);

      await this.updateRefreshTokenHash(user.id, refreshToken);

      const result = {
        user: { id: user.id, email: user.email, role: user.role },
        accessToken,
        refreshToken,
      };
      console.log(
        'AuthService.signIn returning:',
        JSON.stringify(result, null, 2),
      );
      return result;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Sign in error:', error);
      throw new InternalServerErrorException(
        'An error occurred during sign in',
      );
    }
  }

  async refreshToken(
    userId: number,
    rt: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    console.log(`Attempting refresh for user ${userId}`);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.hashedRefreshToken) {
      console.warn(
        `Refresh Denied: User ${userId} not found or no stored hash.`,
      );
      throw new UnauthorizedException('Access Denied');
    }

    // Compare the provided token (rt) with the stored hash
    const rtMatches = await bcrypt.compare(rt, user.hashedRefreshToken);
    if (!rtMatches) {
      console.warn(
        `Refresh Denied: Provided token does not match stored hash for user ${userId}.`,
      );
      throw new UnauthorizedException('Access Denied');
    }
    console.log(`Refresh Granted: Token match successful for user ${userId}.`);

    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokens(user);

    await this.updateRefreshTokenHash(user.id, newRefreshToken);
    console.log(`Refresh Rotation: Stored new token hash for user ${userId}.`);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: number): Promise<boolean> {
    console.log(`Logging out user ${userId}. Clearing token hash.`);
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        hashedRefreshToken: { not: null },
      },
      data: {
        hashedRefreshToken: null,
      },
    });
    return true;
  }

  async signUp(email: string, password: string): Promise<User> {
    try {
      this.validateEmail(email);
      this.validatePassword(password);

      const userCount = await this.userService.count();
      const role = userCount === 0 ? UserRole.ADMIN : UserRole.PENDING;

      const existingUser = await this.userService.findOne(email);
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      return this.userService.create(email, hashedPassword, role);
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Sign up error:', error);
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
