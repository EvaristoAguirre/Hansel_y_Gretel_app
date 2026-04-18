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

  /** Emite un evento a TODOS los clientes conectados. */
  broadcast(event: string, data: any) {
    if (!this.server) {
      this.logger.error('WebSocket server is not initialized!');
      return;
    }
    this.logger.log(`📡 Emitiendo evento global: ${event}`);
    this.server.emit(event, data);
  }

  /** Emite un evento solo a los clientes suscritos a la sala de una mesa.
   *  Los clientes se unen a la sala `table:{tableId}` cuando seleccionan la mesa. */
  broadcastToTable(tableId: string, event: string, data: any) {
    if (!this.server) {
      this.logger.error('WebSocket server is not initialized!');
      return;
    }
    const room = `table:${tableId}`;
    this.logger.log(`📡 Emitiendo evento a sala ${room}: ${event}`);
    this.server.to(room).emit(event, data);
  }
}
