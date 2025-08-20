import {
  Injectable,
  CanActivate,
  Logger,
  ExecutionContext,
} from '@nestjs/common';
import { Socket } from 'socket.io';
import { TokenService } from '../../auth/token.service';
import { TokenBlacklistService } from '../../auth/token-blacklist.service';
import { ExceptionFactory } from '../../common/exceptions';

@Injectable()
export class WebSocketAuthGuard implements CanActivate {
  private readonly logger = new Logger(WebSocketAuthGuard.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();

    try {
      const token = this.extractTokenFromSocket(client);

      if (!token) {
        const exception = ExceptionFactory.webSocketAuthRequired();
        this.logger.warn(
          { socketId: client.id, error: exception.errorCode },
          'WebSocket connection denied: No token provided',
        );
        this.emitAuthError(client, exception);
        return false;
      }

      // Check if token is blacklisted
      if (this.tokenBlacklistService.isTokenBlacklisted(token)) {
        const exception = ExceptionFactory.tokenBlacklisted();
        this.logger.warn(
          { socketId: client.id, error: exception.errorCode },
          'WebSocket connection denied: Token is blacklisted',
        );
        this.emitAuthError(client, exception);
        return false;
      }

      // Verify JWT token
      const payload = await this.tokenService.verifyAccessToken(token);

      // Store user info in socket for later use
      client.data.user = payload;
      client.data.userId = payload.id;

      this.logger.debug(
        { socketId: client.id, userId: payload.id },
        'WebSocket connection authenticated successfully',
      );

      return true;
    } catch (error) {
      const exception = ExceptionFactory.tokenExpired();
      this.logger.warn(
        { err: error, socketId: client.id, error: exception.errorCode },
        'WebSocket authentication failed',
      );

      this.emitAuthError(client, exception);
      return false;
    }
  }

  private emitAuthError(client: Socket, exception: any): void {
    const errorResponse = {
      message: exception.message,
      error: exception.errorCode,
      statusCode: exception.getStatus(),
      timestamp: new Date().toISOString(),
    };

    client.emit('auth_error', errorResponse);
  }

  private extractTokenFromSocket(socket: Socket): string | undefined {
    // Try multiple sources for the token
    const authHeader = socket.handshake.headers?.authorization;
    const tokenFromAuth = socket.handshake.auth?.token;
    const tokenFromQuery = socket.handshake.query?.token;

    // Extract from Authorization header (Bearer token)
    if (authHeader) {
      const token = this.tokenService.extractTokenFromAuthHeader(authHeader);
      if (token) return token;
    }

    // Extract from auth object
    if (tokenFromAuth && typeof tokenFromAuth === 'string') {
      return tokenFromAuth;
    }

    // Extract from query parameters
    if (tokenFromQuery && typeof tokenFromQuery === 'string') {
      return tokenFromQuery;
    }

    return undefined;
  }
}
