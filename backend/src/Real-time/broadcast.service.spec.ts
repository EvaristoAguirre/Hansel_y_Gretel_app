import { BroadcastService } from './broadcast.service';

describe('BroadcastService', () => {
  let service: BroadcastService;
  let server: { emit: jest.Mock; to: jest.Mock };

  beforeEach(() => {
    service = new BroadcastService();
    const roomEmit = jest.fn();
    server = {
      emit: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: roomEmit }),
    };
    service.setServer(server as any);
  });

  it('broadcast emite a todos los clientes', () => {
    service.broadcast('orderUpdated', { id: '1' });
    expect(server.emit).toHaveBeenCalledWith('orderUpdated', { id: '1' });
  });

  it('broadcastToTable emite a la sala table:{id}', () => {
    service.broadcastToTable('mesa-9', 'orderTicketPrinted', { id: '2' });
    expect(server.to).toHaveBeenCalledWith('table:mesa-9');
    expect(server.to('table:mesa-9').emit).toHaveBeenCalledWith(
      'orderTicketPrinted',
      { id: '2' },
    );
  });

  it('no lanza si el server no está inicializado', () => {
    const bare = new BroadcastService();
    expect(() => bare.broadcast('x', {})).not.toThrow();
    expect(() => bare.broadcastToTable('t', 'x', {})).not.toThrow();
  });
});
