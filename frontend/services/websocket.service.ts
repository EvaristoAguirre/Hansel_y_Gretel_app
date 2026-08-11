import { io, Socket } from 'socket.io-client';

type ReconnectCallback = () => void;

/** Exportada para tests unitarios; en runtime se usa el singleton `webSocketService`. */
export class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectCallbacks: Set<ReconnectCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = Infinity;
  private connectionUrl: string | null = null;
  /** Evita registrar los handlers de ciclo de vida más de una vez en el mismo socket. */
  private lifecycleBound = false;

  connect(url?: string): Socket {
    // Reutilizar el socket existente (aunque esté desconectado/reconectando)
    // para no crear conexiones huérfanas.
    if (this.socket) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return this.socket;
    }

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
      reconnectionAttempts: Infinity,
      // En red local (LAN) se conecta directamente por WebSocket sin el
      // handshake inicial de polling, reduciendo latencia en la primera conexión.
      transports: ['websocket'],
    });

    this.bindLifecycleHandlers();

    return this.socket;
  }

  private bindLifecycleHandlers() {
    if (!this.socket || this.lifecycleBound) return;
    this.lifecycleBound = true;

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

    // Los listeners de dominio registrados con socket.on sobreviven a la
    // reconexión del mismo socket; no re-registrarlos (evita handlers N veces).
    this.socket.on('reconnect', () => {
      console.log('✅ Reconectado al servidor WebSocket');
      this.reconnectCallbacks.forEach((cb) => {
        try {
          cb();
        } catch (error) {
          console.error('Error en callback de reconexión WebSocket:', error);
        }
      });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Falló la reconexión al servidor WebSocket');
    });
  }

  private getWebSocketUrl(): string | null {
    const NODE_ENV = process.env.NODE_ENV;
    let wsUrl: string | undefined;

    if (NODE_ENV === 'production') {
      wsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL;
    } else {
      wsUrl =
        process.env.NEXT_PUBLIC_WS_URL_DEV || process.env.NEXT_PUBLIC_API_URL_DEV;
    }

    return wsUrl || null;
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    } else {
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
      this.listeners.delete(event);
      if (this.socket) {
        this.socket.off(event);
      }
    }
  }

  /** Callbacks para re-join de salas / resync REST tras reconexión. */
  onReconnect(callback: ReconnectCallback) {
    this.reconnectCallbacks.add(callback);
  }

  offReconnect(callback: ReconnectCallback) {
    this.reconnectCallbacks.delete(callback);
  }

  /** Suscribirse a la sala de una mesa para recibir eventos de esa mesa específica. */
  joinTable(tableId: string) {
    if (!tableId) return;
    const socket = this.socket ?? this.connect();
    socket.emit('joinTable', { tableId });
  }

  /** Abandonar la sala de una mesa. */
  leaveTable(tableId: string) {
    if (!tableId || !this.socket) return;
    this.socket.emit('leaveTable', { tableId });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.reconnectCallbacks.clear();
      this.connectionUrl = null;
      this.lifecycleBound = false;
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
