import { Injectable } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class TokenBlacklistService {
  private blacklistedTokens = new Set<string>();
  private blacklistCleanupInterval: NodeJS.Timeout;

  constructor(
    @InjectPinoLogger(TokenBlacklistService.name)
    private readonly logger: PinoLogger,
  ) {
    // Clean up expired tokens every hour
    this.blacklistCleanupInterval = setInterval(
      () => {
        this.cleanupExpiredTokens();
      },
      60 * 60 * 1000,
    );
  }

  /**
   * Add a token to the blacklist by its JTI (JWT ID) or token hash
   */
  blacklistToken(tokenId: string): void {
    this.blacklistedTokens.add(tokenId);
    this.logger.debug({ tokenId }, 'Token added to blacklist');
  }

  /**
   * Check if a token is blacklisted
   */
  isTokenBlacklisted(tokenId: string): boolean {
    return this.blacklistedTokens.has(tokenId);
  }

  /**
   * Blacklist all tokens for a specific user (useful when role changes)
   * This requires tokens to include user ID in a consistent format
   */
  blacklistUserTokens(userId: number): void {
    // For a more robust solution, you'd store user-specific token IDs
    // For now, we'll rely on short token expiration times
    this.logger.info(
      { userId },
      'User tokens should be considered invalid due to role change',
    );

    // Note: In a production environment, you'd want to:
    // 1. Store user tokens in Redis with user ID mapping
    // 2. Invalidate all tokens for that user
    // 3. Or implement token versioning in JWT payload
  }

  /**
   * Clean up tokens that are past their expiration time
   * This is a simple cleanup - in production, use Redis with TTL
   */
  private cleanupExpiredTokens(): void {
    // Since we don't store expiration times in this simple implementation,
    // we'll clear the entire blacklist periodically
    // In production, use Redis with proper TTL handling
    const size = this.blacklistedTokens.size;
    this.blacklistedTokens.clear();
    this.logger.debug({ clearedTokens: size }, 'Cleaned up blacklisted tokens');
  }

  onModuleDestroy() {
    if (this.blacklistCleanupInterval) {
      clearInterval(this.blacklistCleanupInterval);
    }
  }
}
