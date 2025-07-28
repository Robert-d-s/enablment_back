import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { WebSocketConnectionInfo } from '../dto/issue-update.dto';
import { WEBSOCKET_CONSTANTS } from '../constants/websocket.constants';

@Injectable()
export class ConnectionManagerService {
  private connections = new Map<string, WebSocketConnectionInfo>();
  private userConnections = new Map<string, Set<string>>();
  private rateLimitMap = new Map<
    string,
    { count: number; resetTime: number }
  >();

  constructor(
    @InjectPinoLogger(ConnectionManagerService.name)
    private readonly logger: PinoLogger,
  ) {
    // Cleanup interval for expired rate limits
    setInterval(() => this.cleanupRateLimits(), 60000); // Every minute
  }

  addConnection(socket: Socket, userId?: string): void {
    const now = new Date();
    const connectionInfo: WebSocketConnectionInfo = {
      id: socket.id,
      userId,
      connectedAt: now,
      lastActivity: now,
      subscriptions: new Set(),
    };

    this.connections.set(socket.id, connectionInfo);

    if (userId) {
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(socket.id);

      // Check connection limit per user
      const userConnectionCount = this.userConnections.get(userId)!.size;
      if (
        userConnectionCount >
        WEBSOCKET_CONSTANTS.LIMITS.MAX_CONNECTIONS_PER_USER
      ) {
        this.logger.warn(
          { userId, connectionCount: userConnectionCount },
          'User exceeded maximum connection limit',
        );
        // Could implement connection dropping logic here
      }
    }

    this.logger.info(
      {
        socketId: socket.id,
        userId,
        totalConnections: this.connections.size,
      },
      'WebSocket connection added',
    );
  }

  removeConnection(socketId: string): void {
    const connection = this.connections.get(socketId);
    if (connection) {
      if (connection.userId) {
        const userConnections = this.userConnections.get(connection.userId);
        if (userConnections) {
          userConnections.delete(socketId);
          if (userConnections.size === 0) {
            this.userConnections.delete(connection.userId);
          }
        }
      }
      this.connections.delete(socketId);

      this.logger.info(
        {
          socketId,
          userId: connection.userId,
          sessionDuration: Date.now() - connection.connectedAt.getTime(),
          totalConnections: this.connections.size,
        },
        'WebSocket connection removed',
      );
    }
  }

  updateActivity(socketId: string): void {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.lastActivity = new Date();
    }
  }

  getConnection(socketId: string): WebSocketConnectionInfo | undefined {
    return this.connections.get(socketId);
  }

  getUserConnections(userId: string): string[] {
    return Array.from(this.userConnections.get(userId) || []);
  }

  getAllConnections(): WebSocketConnectionInfo[] {
    return Array.from(this.connections.values());
  }

  getConnectionStats(): {
    totalConnections: number;
    authenticatedConnections: number;
    anonymousConnections: number;
    uniqueUsers: number;
  } {
    const total = this.connections.size;
    const authenticated = Array.from(this.connections.values()).filter(
      (conn) => conn.userId,
    ).length;

    return {
      totalConnections: total,
      authenticatedConnections: authenticated,
      anonymousConnections: total - authenticated,
      uniqueUsers: this.userConnections.size,
    };
  }

  // Rate limiting functionality
  checkRateLimit(socketId: string): boolean {
    const now = Date.now();
    const rateLimit = this.rateLimitMap.get(socketId);

    if (!rateLimit || now > rateLimit.resetTime) {
      // Reset or create new rate limit window
      this.rateLimitMap.set(socketId, {
        count: 1,
        resetTime: now + WEBSOCKET_CONSTANTS.LIMITS.RATE_LIMIT_WINDOW,
      });
      return true;
    }

    if (rateLimit.count >= WEBSOCKET_CONSTANTS.LIMITS.RATE_LIMIT_MAX_MESSAGES) {
      this.logger.warn(
        { socketId, count: rateLimit.count },
        'Rate limit exceeded for socket',
      );
      return false;
    }

    rateLimit.count++;
    return true;
  }

  private cleanupRateLimits(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [socketId, rateLimit] of this.rateLimitMap.entries()) {
      if (now > rateLimit.resetTime) {
        expiredKeys.push(socketId);
      }
    }

    expiredKeys.forEach((key) => this.rateLimitMap.delete(key));

    if (expiredKeys.length > 0) {
      this.logger.debug(
        { cleanedCount: expiredKeys.length },
        'Cleaned up expired rate limits',
      );
    }
  }

  // Cleanup inactive connections
  cleanupInactiveConnections(): string[] {
    const now = Date.now();
    const timeout = WEBSOCKET_CONSTANTS.LIMITS.CONNECTION_TIMEOUT;
    const inactiveConnections: string[] = [];

    for (const [socketId, connection] of this.connections.entries()) {
      if (now - connection.lastActivity.getTime() > timeout) {
        inactiveConnections.push(socketId);
      }
    }

    this.logger.info(
      { inactiveCount: inactiveConnections.length },
      'Found inactive connections for cleanup',
    );

    return inactiveConnections;
  }
}
