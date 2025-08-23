import {
  Injectable,
  CanActivate,
  Logger,
  ExecutionContext,
} from '@nestjs/common';
import { Socket } from 'socket.io';
import { TokenService } from '../../auth/token.service';
import { TokenBlacklistService } from '../../common/services/token-blacklist.service';
import { ExceptionFactory, BaseAppException } from '../../common/exceptions';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WebSocketAuthGuard implements CanActivate {
  private readonly logger = new Logger(WebSocketAuthGuard.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly prismaService: PrismaService,
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

      // Verify JWT token
      const payload = await this.tokenService.verifyAccessToken(token);

      // Check if token is blacklisted using JTI
      if (
        payload.jti &&
        this.tokenBlacklistService.isTokenBlacklisted(payload.jti)
      ) {
        const exception = ExceptionFactory.tokenBlacklisted();
        this.logger.warn(
          {
            socketId: client.id,
            userId: payload.id,
            jti: payload.jti,
            error: exception.errorCode,
          },
          'WebSocket connection denied: Token JTI is blacklisted',
        );
        this.emitAuthError(client, exception);
        return false;
      }

      // Ensure tokenVersion and role are still valid (parity with HTTP AuthGuard)
      const currentUser = await this.prismaService.user.findUnique({
        where: { id: payload.id },
        select: { tokenVersion: true, role: true },
      });

      if (!currentUser) {
        const exception = ExceptionFactory.userNotFound(payload.id, 'ws auth');
        this.logger.warn(
          {
            socketId: client.id,
            userId: payload.id,
            error: exception.errorCode,
          },
          'WebSocket connection denied: User not found',
        );
        this.emitAuthError(client, exception);
        return false;
      }

      if (currentUser.tokenVersion !== payload.tokenVersion) {
        const exception = ExceptionFactory.tokenExpired();
        this.logger.warn(
          {
            socketId: client.id,
            userId: payload.id,
            tokenVersion: payload.tokenVersion,
            currentVersion: currentUser.tokenVersion,
            error: exception.errorCode,
          },
          'WebSocket connection denied: Token invalidated due to role change',
        );
        this.emitAuthError(client, exception);
        return false;
      }

      if (currentUser.role !== payload.role) {
        const exception = ExceptionFactory.insufficientPermissions(
          'connect to websocket',
        );
        this.logger.warn(
          {
            socketId: client.id,
            userId: payload.id,
            tokenRole: payload.role,
            currentRole: currentUser.role,
            error: exception.errorCode,
          },
          'WebSocket connection denied: Role mismatch',
        );
        this.emitAuthError(client, exception);
        return false;
      }

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

  private emitAuthError(client: Socket, exception: BaseAppException): void {
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
