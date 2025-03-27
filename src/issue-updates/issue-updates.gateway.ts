import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { getCorsConfig } from '../config/cors.config';

@WebSocketGateway({
  cors: getCorsConfig(),
})
export class IssueUpdatesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('IssueUpdatesGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  broadcastIssueUpdate(issueUpdate: any) {
    this.server.emit('issueUpdate', issueUpdate);
    this.logger.debug(`Broadcasted issue update: ${issueUpdate.id}`);
  }
}
