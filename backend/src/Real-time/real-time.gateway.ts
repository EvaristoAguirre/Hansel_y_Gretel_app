import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { BroadcastService } from './broadcast.service';

const wsOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

@WebSocketGateway({
  cors: {
    origin: wsOrigins.length ? wsOrigins : ['http://localhost:3001'],
    credentials: true,
  },
})
export class RealTimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  private logger: Logger = new Logger('EventsGateway');

  constructor(private readonly broadcastService: BroadcastService) {}

  afterInit(server: Server) {
    this.broadcastService.setServer(server);
    this.logger.log('WebSocket server initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /** El cliente se suscribe a la sala de una mesa para recibir eventos específicos de esa mesa. */
  @SubscribeMessage('joinTable')
  handleJoinTable(
    @MessageBody() payload: { tableId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!payload?.tableId) return;
    const room = `table:${payload.tableId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
  }

  /** El cliente abandona la sala de una mesa. */
  @SubscribeMessage('leaveTable')
  handleLeaveTable(
    @MessageBody() payload: { tableId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!payload?.tableId) return;
    const room = `table:${payload.tableId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
  }
}
