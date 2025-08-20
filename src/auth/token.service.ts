import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AccessTokenPayload {
  email: string;
  sub: number;
  id: number;
  role: string;
  tokenVersion: number;
}

export interface RefreshTokenPayload {
  sub: number;
}

@Injectable()
export class TokenService {
  constructor(
    @InjectPinoLogger(TokenService.name)
    private readonly logger: PinoLogger,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokens(user: User): Promise<TokenPair> {
    const accessTokenPayload: AccessTokenPayload = {
      email: user.email,
      sub: user.id,
      id: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    const refreshTokenPayload: RefreshTokenPayload = {
      sub: user.id,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn:
          this.configService.get<string>('JWT_SECRET_EXPIRATION') ?? '15m',
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn:
          this.configService.get<string>('JWT_REFRESH_EXPIRATION') ?? '7d',
      }),
    ]);

    this.logger.debug(`Generated token pair for user ${user.id}`);
    return { accessToken, refreshToken };
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        token,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );
      this.logger.debug(`Verified refresh token for user ${payload.sub}`);
      return payload;
    } catch (error) {
      this.logger.warn({ error }, 'Refresh token verification failed');
      throw error;
    }
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        token,
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        },
      );
      return payload;
    } catch (error) {
      this.logger.warn({ error }, 'Access token verification failed');
      throw error;
    }
  }

  extractTokenFromAuthHeader(authHeader?: string): string | undefined {
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return undefined;
  }

  getTokenExpiry(token: string): number | null {
    try {
      const decoded = this.jwtService.decode(token) as { exp?: number } | null;
      if (!decoded || typeof decoded.exp !== 'number') return null;
      return decoded.exp * 1000;
    } catch (err) {
      this.logger.warn({ err }, 'Failed to decode token for expiry extraction');
      return null;
    }
  }
}
