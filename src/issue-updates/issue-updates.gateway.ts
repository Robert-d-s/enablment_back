import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { getCorsConfig } from '../config/cors.config';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { BroadcastOptions } from './dto/issue-update.dto';
import { WEBSOCKET_CONSTANTS } from './constants/websocket.constants';
import { IssueUpdateValidationService } from './utils/issue-update-validation.service';
import { ConnectionManagerService } from './services/connection-manager.service';

@WebSocketGateway({
  cors: getCorsConfig(),
})
export class IssueUpdatesGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server: Server;

  constructor(
    @InjectPinoLogger(IssueUpdatesGateway.name)
    private readonly logger: PinoLogger,
    private readonly connectionManager: ConnectionManagerService,
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
      // Extract user info from auth token if available
      const userId = this.extractUserIdFromSocket(client);

      this.connectionManager.addConnection(client, userId);
      this.logger.info(
        { clientId: client.id, userId },
        'Client connected to WebSocket',
      );

      // Send connection confirmation
      client.emit(WEBSOCKET_CONSTANTS.EVENTS.CONNECTION_STATUS, {
        status: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(
        { err: error, clientId: client.id },
        'Error handling new connection',
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

  // Additional utility methods
  private extractUserIdFromSocket(socket: Socket): string | undefined {
    try {
      // Extract from auth token or headers
      const token =
        socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (token) {
        // TODO: Implement proper JWT token validation
        // For now, return undefined (anonymous connection)
        return undefined;
      }
      return undefined;
    } catch (error) {
      this.logger.warn(
        { err: error, socketId: socket.id },
        'Failed to extract user ID from socket',
      );
      return undefined;
    }
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
