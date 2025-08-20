import { Injectable } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class TokenBlacklistService {
  private blacklistedTokens = new Map<string, number>();
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

  blacklistUserTokens(userId: number): void {
    this.logger.info(
      { userId },
      'User tokens should be considered invalid due to role change',
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
    if (this.blacklistCleanupInterval) {
      clearInterval(this.blacklistCleanupInterval);
    }
  }
}
