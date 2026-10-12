import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderService } from './order.service';
import { OrderState } from 'src/Enums/states.enum';

describe('OrderService.tryPrintKitchenOrder', () => {
  const printerService = {
    logger: { log: jest.fn(), error: jest.fn() },
    printKitchenOrder: jest.fn(),
  };
  const eventEmitter = { emit: jest.fn() };

  const service = new OrderService(
    {} as any,
    {} as any,
    eventEmitter as unknown as EventEmitter2,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    printerService as any,
    {} as any,
  );

  const printData = {
    numberCustomers: 2,
    table: 'Mesa 1',
    products: [{ name: 'Cafe', quantity: 1 }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('si el print falla no lanza y emite printerError', async () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    printerService.printKitchenOrder.mockRejectedValue(new Error('down'));
    try {
      const result = await (service as any).tryPrintKitchenOrder(printData, {
        id: 'order-1',
        state: OrderState.OPEN,
      });
      expect(result.commandNumber).toBeNull();
      expect(result.comandaWarning).toContain('Reimprimir comanda');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'order.printerError',
        expect.objectContaining({ message: result.comandaWarning }),
      );
    } finally {
      process.env.NODE_ENV = previousEnv;
    }
  });
});
