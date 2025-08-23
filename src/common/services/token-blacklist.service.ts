import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class TokenBlacklistService implements OnModuleDestroy {
  private blacklistedTokens = new Map<string, number>();
  private userTokens = new Map<number, Set<string>>();
  private blacklistCleanupInterval: NodeJS.Timeout;

  constructor(
    @InjectPinoLogger(TokenBlacklistService.name)
    private readonly logger: PinoLogger,
  ) {
    this.blacklistCleanupInterval = setInterval(
      () => {
        this.cleanupExpiredTokens();
      },
      60 * 60 * 1000,
    );
  }

  blacklistToken(
    tokenId: string,
    opts?: { expiresAt?: number; ttlMs?: number },
  ): void {
    const expiresAt =
      opts?.expiresAt ??
      (opts?.ttlMs
        ? Date.now() + opts.ttlMs
        : Date.now() + 7 * 24 * 60 * 60 * 1000);

    this.blacklistedTokens.set(tokenId, expiresAt);
    this.logger.debug({ tokenId, expiresAt }, 'Token added to blacklist');
  }

  isTokenBlacklisted(tokenId: string): boolean {
    const exp = this.blacklistedTokens.get(tokenId);
    if (!exp) return false;

    if (Date.now() > exp) {
      this.blacklistedTokens.delete(tokenId);
      return false;
    }

    return true;
  }

  trackUserToken(userId: number, tokenId: string): void {
    if (!this.userTokens.has(userId)) {
      this.userTokens.set(userId, new Set());
    }
    this.userTokens.get(userId)!.add(tokenId);
    this.logger.debug({ userId, tokenId }, 'Token tracked for user');
  }

  blacklistUserTokens(userId: number): void {
    const userTokenIds = this.userTokens.get(userId);
    if (!userTokenIds || userTokenIds.size === 0) {
      this.logger.info(
        { userId },
        'No tracked tokens found for user - role change invalidation via tokenVersion only',
      );
      return;
    }

    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    let blacklistedCount = 0;

    for (const tokenId of userTokenIds) {
      this.blacklistedTokens.set(tokenId, expiresAt);
      blacklistedCount++;
    }

    this.userTokens.delete(userId);

    this.logger.info(
      { userId, blacklistedCount },
      'All tracked tokens blacklisted for user due to role change',
    );
  }

  private cleanupExpiredTokens(): void {
    const now = Date.now();
    let removed = 0;

    for (const [tokenId, expiresAt] of this.blacklistedTokens) {
      if (now > expiresAt) {
        this.blacklistedTokens.delete(tokenId);
        removed++;
      }
    }
    this.logger.debug({ removed }, 'Cleaned up expired blacklisted tokens');
  }

  onModuleDestroy(): void {
    this.logger.info(
      'TokenBlacklistService shutting down, cleaning up interval',
    );

    if (this.blacklistCleanupInterval) {
      clearInterval(this.blacklistCleanupInterval);
      this.logger.debug('Blacklist cleanup interval cleared');
    }

    // Clear all tracking maps
    this.blacklistedTokens.clear();
    this.userTokens.clear();

    this.logger.info('TokenBlacklistService shutdown complete');
  }
}
