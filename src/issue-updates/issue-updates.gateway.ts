import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { getWebSocketCorsConfig } from '../config/cors.config';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { BroadcastOptions } from './dto/issue-update.dto';
import { WEBSOCKET_CONSTANTS } from './constants/websocket.constants';
import { IssueUpdateValidationService } from './utils/issue-update-validation.service';
import { ConnectionManagerService } from './services/connection-manager.service';
import { WebSocketAuthGuard } from './guards/websocket-auth.guard';
import { TokenService } from '../auth/token.service';
import { TokenBlacklistService } from '../common/services/token-blacklist.service';

@WebSocketGateway({
  cors: getWebSocketCorsConfig(),
})
@UseGuards(WebSocketAuthGuard)
export class IssueUpdatesGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server: Server;

  constructor(
    @InjectPinoLogger(IssueUpdatesGateway.name)
    private readonly logger: PinoLogger,
    private readonly connectionManager: ConnectionManagerService,
    private readonly tokenService: TokenService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  afterInit(): void {
    this.logger.info('WebSocket Gateway initialized');

    // Setup heartbeat interval
    setInterval(() => {
      this.sendHeartbeat();
    }, WEBSOCKET_CONSTANTS.LIMITS.HEARTBEAT_INTERVAL);

    // Setup cleanup interval for inactive connections
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, WEBSOCKET_CONSTANTS.LIMITS.CONNECTION_TIMEOUT);
  }

  handleConnection(client: Socket): void {
    try {
      // User ID is now available from authentication guard
      const userId = client.data.userId || client.data.user?.id;

      this.connectionManager.addConnection(client, userId);
      this.logger.info(
        { clientId: client.id, userId, userEmail: client.data.user?.email },
        'Authenticated client connected to WebSocket',
      );

      // Send connection confirmation with user info
      client.emit(WEBSOCKET_CONSTANTS.EVENTS.CONNECTION_STATUS, {
        status: 'connected',
        authenticated: true,
        userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(
        { err: error, clientId: client.id },
        'Error handling authenticated connection',
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.connectionManager.removeConnection(client.id);
    this.logger.info(
      { clientId: client.id },
      'Client disconnected from WebSocket',
    );
  }

  broadcastIssueUpdate(
    issueUpdate: unknown,
    options: BroadcastOptions = {},
  ): void {
    try {
      // Validate and sanitize the issue update
      const validatedUpdate =
        IssueUpdateValidationService.validateIssueUpdate(issueUpdate);
      const sanitizedUpdate =
        IssueUpdateValidationService.sanitizeMessage(validatedUpdate);

      // Add metadata if requested
      const finalUpdate = options.includeMetadata
        ? {
            ...sanitizedUpdate,
            metadata: {
              timestamp: new Date().toISOString(),
              version: '1.0',
            },
          }
        : sanitizedUpdate;

      this.logger.debug(
        { issueId: sanitizedUpdate.id, action: sanitizedUpdate.action },
        'Broadcasting issue update',
      );

      // Broadcast to all connected clients or specific room
      if (options.room) {
        this.server
          .to(options.room)
          .emit(WEBSOCKET_CONSTANTS.EVENTS.ISSUE_UPDATE, finalUpdate);
      } else {
        // Broadcast to all clients except excluded one
        if (options.excludeClient) {
          this.server
            .except(options.excludeClient)
            .emit(WEBSOCKET_CONSTANTS.EVENTS.ISSUE_UPDATE, finalUpdate);
        } else {
          this.server.emit(
            WEBSOCKET_CONSTANTS.EVENTS.ISSUE_UPDATE,
            finalUpdate,
          );
        }
      }

      this.logger.info(
        {
          issueId: sanitizedUpdate.id,
          action: sanitizedUpdate.action,
          connectionsCount: this.connectionManager.getAllConnections().length,
        },
        'Issue update broadcasted successfully',
      );
    } catch (error) {
      this.logger.error(
        { err: error, issueUpdate },
        'Error broadcasting issue update',
      );

      // Send error to specific client if provided
      if (options.excludeClient) {
        const client = this.server.sockets.sockets.get(options.excludeClient);
        if (client) {
          client.emit(WEBSOCKET_CONSTANTS.EVENTS.ERROR, {
            message: 'Failed to process issue update',
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
  }

  // Additional utility methods - now handled by authentication guard
  private getUserFromSocket(
    socket: Socket,
  ): { id: number; email: string; role: string } | undefined {
    return socket.data.user;
  }

  private sendHeartbeat(): void {
    const stats = this.connectionManager.getConnectionStats();
    this.server.emit(WEBSOCKET_CONSTANTS.EVENTS.HEARTBEAT, {
      timestamp: new Date().toISOString(),
      connections: stats.totalConnections,
    });

    this.logger.debug({ stats }, 'Heartbeat sent to all connections');
  }

  private cleanupInactiveConnections(): void {
    const inactiveConnections =
      this.connectionManager.cleanupInactiveConnections();

    inactiveConnections.forEach((socketId) => {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
        this.logger.info({ socketId }, 'Disconnected inactive connection');
      }
    });
  }

  // Public methods for connection management
  getConnectionStats(): ReturnType<
    ConnectionManagerService['getConnectionStats']
  > {
    return this.connectionManager.getConnectionStats();
  }

  disconnectUser(userId: string): void {
    const userConnections = this.connectionManager.getUserConnections(userId);
    userConnections.forEach((socketId) => {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
        this.logger.info({ userId, socketId }, 'Forcibly disconnected user');
      }
    });
  }
}
