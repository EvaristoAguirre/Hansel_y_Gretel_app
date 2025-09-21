import { Injectable, NestMiddleware } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthMiddleware implements NestMiddleware {
  use(socket: Socket, next: (err?: Error) => void) {
    // const token = socket.handshake.auth?.token;

    // if (!token || token !== 'valid-token') {
    //   return next(new Error('Unauthorized'));
    // }

    // // Agregar información del usuario al socket
    // (socket as any).user = { id: 123, name: 'Usuario Ejemplo' };
    next();
  }
}
