import {
  Injectable,
  CanActivate,
  Logger,
  ExecutionContext,
} from '@nestjs/common';
import { Socket } from 'socket.io';
import { TokenService } from '../../auth/token.service';
import { TokenBlacklistService } from '../../auth/token-blacklist.service';

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
        this.logger.warn(
          { socketId: client.id },
          'WebSocket connection denied: No token provided',
        );
        client.emit('auth_error', {
          message: 'Authentication required',
          code: 'NO_TOKEN',
        });
        return false;
      }

      // Check if token is blacklisted
      if (this.tokenBlacklistService.isTokenBlacklisted(token)) {
        this.logger.warn(
          { socketId: client.id },
          'WebSocket connection denied: Token is blacklisted',
        );
        client.emit('auth_error', {
          message: 'Token is invalid',
          code: 'TOKEN_BLACKLISTED',
        });
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
      this.logger.warn(
        { err: error, socketId: client.id },
        'WebSocket authentication failed',
      );

      client.emit('auth_error', {
        message: 'Authentication failed',
        code: 'INVALID_TOKEN',
      });

      return false;
    }
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
