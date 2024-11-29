import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { BroadcastService } from './broadcast.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class RealTimeGateway implements OnGatewayInit {
  @WebSocketServer()
  private server: Server;

  constructor(private readonly broadcastService: BroadcastService) {}

  afterInit(server: Server) {
    // Configurar el servidor en BroadcastService
    this.broadcastService.setServer(server);
    console.log('WebSocket Gateway inicializado.');
  }
}
