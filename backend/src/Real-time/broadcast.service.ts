import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class BroadcastService {
  private server: Server;
  private logger: Logger = new Logger('BroadcastService');

  setServer(server: Server) {
    this.server = server;
    this.logger.log('WebSocket Server assigned to BroadcastService');
  }

  broadcast(event: string, data: any) {
    if (!this.server) {
      this.logger.error('WebSocket server is not initialized!');
      return;
    }
    this.logger.log(`📡 Emitiendo evento: ${event}`, data);
    this.server.emit(event, data);
  }
}
