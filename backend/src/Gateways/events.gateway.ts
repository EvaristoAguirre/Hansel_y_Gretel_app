import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger('EventsGateway');

    afterInit(server: Server) {
        this.server = server;  // Aseguramos que el servidor está inicializado
        this.logger.log('✅ WebSocket server initialized');
    }

    handleConnection(client: Socket) {
        this.logger.log(`🟢 Cliente conectado: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`🔴 Cliente desconectado: ${client.id}`);
    }

    sendUpdate() {
        if (!this.server) {
            this.logger.error('❌ Error: WebSocket Server no está inicializado.');
            return;
        }

        this.logger.log('📢 Enviando evento de actualización a clientes');
        this.server.emit('actualizacion');
    }
}
