import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from './auth.guard';
import { UserProfileDto } from './dto/user-profile.dto';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

interface JwtVerificationCache {
  token: string;
  payload: JwtPayload;
  user: UserProfileDto;
  verifiedAt: number;
}

interface RequestWithJwtCache extends Request {
  _jwtCache?: JwtVerificationCache;
}

@Injectable()
export class JwtCacheService {
  constructor(
    @InjectPinoLogger(JwtCacheService.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Get cached JWT verification result for the current request
   */
  getCachedVerification(
    request: RequestWithJwtCache,
    token: string,
  ): JwtVerificationCache | null {
    if (request._jwtCache && request._jwtCache.token === token) {
      this.logger.debug('JWT cache hit for token');
      return request._jwtCache;
    }
    return null;
  }

  /**
   * Cache JWT verification result for the current request
   */
  setCachedVerification(
    request: RequestWithJwtCache,
    token: string,
    payload: JwtPayload,
    user: UserProfileDto,
  ): void {
    request._jwtCache = {
      token,
      payload,
      user,
      verifiedAt: Date.now(),
    };
    this.logger.debug('JWT verification result cached for request');
  }

  /**
   * Clear JWT cache for the current request
   */
  clearCache(request: RequestWithJwtCache): void {
    if (request._jwtCache) {
      delete request._jwtCache;
      this.logger.debug('JWT cache cleared for request');
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(request: RequestWithJwtCache): {
    hasCachedResult: boolean;
    cachedAt?: number;
    cacheAge?: number;
  } {
    if (request._jwtCache) {
      return {
        hasCachedResult: true,
        cachedAt: request._jwtCache.verifiedAt,
        cacheAge: Date.now() - request._jwtCache.verifiedAt,
      };
    }
    return { hasCachedResult: false };
  }
}
