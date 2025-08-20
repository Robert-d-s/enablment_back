import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import type { JwtPayload } from './types';
import { UserProfileDto } from './dto/user-profile.dto';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';

interface JwtVerificationCache {
  token: string;
  payload: JwtPayload;
  user: UserProfileDto;
  verifiedAt: number;
}

type RequestWithJwtCache = Request & {
  [k: symbol]: JwtVerificationCache | undefined;
};
export const JWT_CACHE_KEY = Symbol('jwtCache');

@Injectable()
export class JwtCacheService {
  constructor(
    @InjectPinoLogger(JwtCacheService.name)
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
  ) {
    const raw = this.configService.get<string>('JWT_CACHE_TTL_MS');
    const parsed = raw ? parseInt(raw, 10) : NaN;
    this.cacheTtlMs = Number.isFinite(parsed) ? parsed : 5000;
  }

  private readonly cacheTtlMs: number;

  getCachedVerification(
    request: Request,
    token: string,
  ): JwtVerificationCache | null {
    const cache = (request as RequestWithJwtCache)[JWT_CACHE_KEY];
    if (cache && cache.token === token) {
      const age = Date.now() - cache.verifiedAt;
      if (this.cacheTtlMs > 0 && age > this.cacheTtlMs) {
        delete (request as RequestWithJwtCache)[JWT_CACHE_KEY];
        this.logger.debug({ age }, 'JWT cache entry expired, ignoring');
        return null;
      }
      this.logger.debug('JWT cache hit for token');
      return cache;
    }
    return null;
  }

  setCachedVerification(
    request: Request,
    token: string,
    payload: JwtPayload,
    user: UserProfileDto,
  ): void {
    (request as RequestWithJwtCache)[JWT_CACHE_KEY] = {
      token,
      payload,
      user,
      verifiedAt: Date.now(),
    } as JwtVerificationCache;
    this.logger.debug('JWT verification result cached for request');
  }

  clearCache(request: Request): void {
    const cacheSlot = (request as RequestWithJwtCache)[JWT_CACHE_KEY];
    if (cacheSlot) {
      delete (request as RequestWithJwtCache)[JWT_CACHE_KEY];
      this.logger.debug('JWT cache cleared for request');
    }
  }

  getCacheStats(request: Request): {
    hasCachedResult: boolean;
    cachedAt?: number;
    cacheAge?: number;
  } {
    const cache = (request as RequestWithJwtCache)[JWT_CACHE_KEY];
    if (cache) {
      return {
        hasCachedResult: true,
        cachedAt: cache.verifiedAt,
        cacheAge: Date.now() - cache.verifiedAt,
      };
    }
    return { hasCachedResult: false };
  }
}
