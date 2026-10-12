import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { BroadcastService } from './broadcast.service';
import { RealTimeGateway } from './real-time.gateway';

describe('RealTimeGateway auth', () => {
  let gateway: RealTimeGateway;
  let jwtService: jest.Mocked<Pick<JwtService, 'verify'>>;
  let broadcast: jest.Mocked<Pick<BroadcastService, 'setServer'>>;

  beforeEach(() => {
    jwtService = { verify: jest.fn() };
    broadcast = { setServer: jest.fn() };
    gateway = new RealTimeGateway(
      broadcast as unknown as BroadcastService,
      jwtService as unknown as JwtService,
    );
  });

  it('registra el middleware de auth en afterInit', () => {
    const server = { use: jest.fn() } as unknown as Server;
    gateway.afterInit(server);
    expect(server.use).toHaveBeenCalledTimes(1);
    expect(broadcast.setServer).toHaveBeenCalledWith(server);
  });

  it('rechaza la conexión si no hay token', () => {
    const next = jest.fn();
    const socket = { handshake: { auth: {} }, data: {} } as unknown as Socket;
    gateway.authenticateSocket(socket, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(jwtService.verify).not.toHaveBeenCalled();
  });

  it('rechaza la conexión si el token es inválido o vencido', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid');
    });
    const next = jest.fn();
    const socket = {
      handshake: { auth: { token: 'bad' } },
      data: {},
    } as unknown as Socket;
    gateway.authenticateSocket(socket, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(next.mock.calls[0][0].message).toBe('Unauthorized');
  });

  it('acepta JWT válido y adjunta el usuario al socket', () => {
    const payload = { username: 'mozo', role: 'Mozo' };
    jwtService.verify.mockReturnValue(payload);
    const next = jest.fn();
    const socket = {
      handshake: { auth: { token: 'ok' } },
      data: {},
    } as unknown as Socket;
    gateway.authenticateSocket(socket, next);
    expect(socket.data.user).toEqual(payload);
    expect(next).toHaveBeenCalledWith();
  });

  it('joinTable une al cliente a table:{id}', () => {
    const client = { join: jest.fn(), id: 's1' } as unknown as Socket;
    gateway.handleJoinTable({ tableId: 'mesa-1' }, client);
    expect(client.join).toHaveBeenCalledWith('table:mesa-1');
  });
});
