import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private connectionUrl: string | null = null;

  connect(url?: string): Socket {
    // Si ya hay una conexión activa, retornarla
    if (this.socket?.connected) {
      return this.socket;
    }

    // Usar la URL proporcionada o la de la variable de entorno
    const wsUrl = url || this.getWebSocketUrl();

    if (!wsUrl) {
      throw new Error(
        'WebSocket URL no configurada. Verifica NEXT_PUBLIC_WS_URL o NEXT_PUBLIC_API_URL'
      );
    }

    this.connectionUrl = wsUrl;

    this.socket = io(wsUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Conectado a WebSocket');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Desconectado del servidor WebSocket:', reason);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(
        `🔄 Intento de reconexión ${attemptNumber}/${this.maxReconnectAttempts}`
      );
      this.reconnectAttempts = attemptNumber;
    });

    this.socket.on('reconnect', () => {
      console.log('✅ Reconectado al servidor WebSocket');
      // Re-registrar todos los listeners cuando se reconecta
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach((callback) => {
          this.socket?.on(event, callback);
        });
      });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Falló la reconexión al servidor WebSocket');
    });

    return this.socket;
  }

  private getWebSocketUrl(): string | null {
    // Intentar obtener la URL de WebSocket desde variables de entorno
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (wsUrl) {
      return wsUrl;
    }

    // Si no hay URL específica de WS, derivar de la URL de la API
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL_DEV || process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      // Convertir http://host:port a ws://host:port o mantener http para socket.io
      return apiUrl;
    }

    return null;
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      // Si el socket no está conectado, conectar primero
      const socket = this.connect();
      socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: any) => void) {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
      if (this.socket) {
        this.socket.off(event, callback);
      }
    } else {
      // Si no se proporciona callback, remover todos los listeners del evento
      this.listeners.delete(event);
      if (this.socket) {
        this.socket.off(event);
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.connectionUrl = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const webSocketService = new WebSocketService();
