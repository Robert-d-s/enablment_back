import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { getCorsConfig } from '../config/cors.config';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@WebSocketGateway({
  cors: getCorsConfig(),
})
export class IssueUpdatesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @InjectPinoLogger(IssueUpdatesGateway.name)
    private readonly logger: PinoLogger,
  ) {}

  @WebSocketServer() server: Server;
  handleConnection(client: Socket) {
    this.logger.info({ clientId: client.id }, 'Client connected to WebSocket');
  }

  handleDisconnect(client: Socket) {
    this.logger.info(
      { clientId: client.id },
      'Client disconnected from WebSocket',
    );
  }

  broadcastIssueUpdate(issueUpdate: any) {
    this.logger.debug(
      { issueId: issueUpdate?.id, action: issueUpdate?.action },
      'Broadcasting issue update',
    );
    this.server.emit('issueUpdate', issueUpdate);
  }
}
