import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { PrinterService } from './printer.service';
import { EnvNames } from '../common/names.env';

describe('PrinterService', () => {
  const configValues: Record<string, string> = {
    [EnvNames.PRINTER.HOST]: '10.0.0.9',
    [EnvNames.PRINTER.PORT]: '9100',
    [EnvNames.PRINTER.TIMEOUT]: '4000',
    [EnvNames.PRINTER.RETRIES]: '1',
  };

  const configService = {
    get: jest.fn((key: string) => configValues[key]),
  };

  const loggerService = {} as any;
  const orderRepo = {
    findOne: jest.fn(),
  };

  const validOrderId = '550e8400-e29b-41d4-a716-446655440000';

  const createService = () =>
    new PrinterService(
      loggerService,
      configService as unknown as ConfigService,
      orderRepo as any,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    configService.get.mockImplementation((key: string) => configValues[key]);
  });

  it('lee host, puerto, timeout y reintentos desde env', () => {
    const service = createService();
    expect((service as any).printerConfig).toEqual({
      host: '10.0.0.9',
      port: 9100,
      timeout: 4000,
      retries: 1,
    });
  });

  it('usa defaults si el env no define impresora', () => {
    configService.get.mockReturnValue(undefined);
    const service = createService();
    expect((service as any).printerConfig).toEqual({
      host: '192.168.70.3',
      port: 9100,
      timeout: 4000,
      retries: 1,
    });
  });

  it('reprintTicketById lanza 404 si la orden no existe', async () => {
    orderRepo.findOne.mockResolvedValue(null);
    const service = createService();
    await expect(service.reprintTicketById(validOrderId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('reprintTicketById carga la orden y no usa el body', async () => {
    const order = {
      id: validOrderId,
      table: { name: 'Mesa 1' },
      orderDetails: [{ isActive: true, product: { name: 'Cafe' } }],
    };
    orderRepo.findOne.mockResolvedValue(order);
    const service = createService();
    const printSpy = jest
      .spyOn(service, 'printTicketOrder')
      .mockResolvedValue('ok');

    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const result = await service.reprintTicketById(validOrderId);
      expect(orderRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: validOrderId, isActive: true },
        }),
      );
      expect(printSpy).toHaveBeenCalledWith(order);
      expect(result).toEqual({ message: 'ok' });
    } finally {
      process.env.NODE_ENV = previousEnv;
    }
  });

  it('reprintTicketById devuelve warning si el print falla (sin 500)', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: validOrderId,
      table: { name: 'Mesa 1' },
      orderDetails: [{ isActive: true }],
    });
    const service = createService();
    jest
      .spyOn(service, 'printTicketOrder')
      .mockRejectedValue(new Error('timeout'));

    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const result = await service.reprintTicketById(validOrderId);
      expect(result.printerWarning).toBeDefined();
      expect(result.message).toContain('No se pudo imprimir');
    } finally {
      process.env.NODE_ENV = previousEnv;
    }
  });
});
