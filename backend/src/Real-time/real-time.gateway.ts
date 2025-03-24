// import {
//   WebSocketGateway,
//   WebSocketServer,
//   OnGatewayInit,
// } from '@nestjs/websockets';
// import { Server } from 'socket.io';
// import { BroadcastService } from './broadcast.service';

// @WebSocketGateway({ cors: { origin: '*' } })
// export class RealTimeGateway implements OnGatewayInit {
//   @WebSocketServer()
//   private server: Server;

//   constructor(private readonly broadcastService: BroadcastService) {}

//   afterInit(server: Server) {
//     // Configurar el servidor en BroadcastService
//     this.broadcastService.setServer(server);
//     console.log('WebSocket Gateway inicializado.');
//   }
// }

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { BroadcastService } from './broadcast.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Permite conexiones desde cualquier origen
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
}
