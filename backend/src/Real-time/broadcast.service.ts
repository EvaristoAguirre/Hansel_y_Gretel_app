import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class BroadcastService {
  private server: Server;

  setServer(server: Server) {
    this.server = server;
  }

  broadcast(event: string, data: any) {
    console.log(`Emitido por WS: ${event}`, data);
    this.server.emit(event, data);
  }
}
