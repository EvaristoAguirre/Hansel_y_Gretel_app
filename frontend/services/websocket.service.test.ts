import { beforeEach, describe, expect, it, vi } from 'vitest';

const lifecycleHandlers: Record<string, Function[]> = {};
const mockSocket = {
  connected: true,
  connect: vi.fn(),
  disconnect: vi.fn(),
  on: vi.fn((event: string, cb: Function) => {
    if (!lifecycleHandlers[event]) lifecycleHandlers[event] = [];
    lifecycleHandlers[event].push(cb);
  }),
  off: vi.fn(),
  emit: vi.fn(),
  once: vi.fn(),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

describe('WebSocketService', () => {
  let WebSocketService: typeof import('./websocket.service').WebSocketService;
  let service: InstanceType<typeof WebSocketService>;

  beforeEach(async () => {
    vi.resetModules();
    Object.keys(lifecycleHandlers).forEach((k) => delete lifecycleHandlers[k]);
    mockSocket.connected = true;
    mockSocket.connect.mockClear();
    mockSocket.disconnect.mockClear();
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
    mockSocket.emit.mockClear();

    process.env.NEXT_PUBLIC_API_URL_DEV = 'http://localhost:3000';
    process.env.NODE_ENV = 'development';

    ({ WebSocketService } = await import('./websocket.service'));
    service = new WebSocketService();
  });

  it('reutiliza el mismo socket en llamadas sucesivas a connect', () => {
    const first = service.connect();
    const second = service.connect();
    expect(first).toBe(second);
    expect(mockSocket.connect).not.toHaveBeenCalled();
  });

  it('no crea un socket nuevo si existe uno desconectado; intenta reconnect', () => {
    service.connect();
    mockSocket.connected = false;
    service.connect();
    expect(mockSocket.connect).toHaveBeenCalledTimes(1);
  });

  it('invoca callbacks onReconnect al evento reconnect del socket', () => {
    service.connect();
    const cb = vi.fn();
    service.onReconnect(cb);

    const reconnectHandlers = lifecycleHandlers['reconnect'] || [];
    expect(reconnectHandlers.length).toBeGreaterThan(0);
    reconnectHandlers.forEach((h) => h());

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('offReconnect deja de invocar el callback', () => {
    service.connect();
    const cb = vi.fn();
    service.onReconnect(cb);
    service.offReconnect(cb);

    (lifecycleHandlers['reconnect'] || []).forEach((h) => h());
    expect(cb).not.toHaveBeenCalled();
  });

  it('joinTable emite joinTable con tableId', () => {
    service.connect();
    service.joinTable('mesa-1');
    expect(mockSocket.emit).toHaveBeenCalledWith('joinTable', {
      tableId: 'mesa-1',
    });
  });
});
