import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderService } from './order.service';
import { OrderState, TableState } from 'src/Enums/states.enum';

const ORDER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

function buildOpenOrder() {
  return {
    id: ORDER_ID,
    isActive: true,
    state: OrderState.OPEN,
    numberCustomers: 2,
    comment: null,
    total: 1000,
    tip: 0,
    discountPercent: 0,
    discountAmount: 0,
    orderDetails: [
      {
        id: 'detail-1',
        isActive: true,
        subtotal: 1000,
        quantity: 1,
        unitaryPrice: 1000,
        commentOfProduct: null,
        product: { id: 'prod-1', name: 'Cafe', allowsToppings: false },
        orderDetailToppings: [],
      },
    ],
    table: {
      id: 'table-1',
      name: 'Mesa 1',
      state: TableState.OPEN,
    },
    payments: [],
  };
}

function buildQueryRunner(options: {
  locked?: { id: string; state: OrderState; isActive: boolean } | null;
  loaded?: ReturnType<typeof buildOpenOrder> | null;
  save?: jest.Mock;
}) {
  const locked =
    options.locked === undefined
      ? { id: ORDER_ID, state: OrderState.OPEN, isActive: true }
      : options.locked;
  const loaded = options.loaded === undefined ? buildOpenOrder() : options.loaded;
  const save =
    options.save ?? jest.fn().mockImplementation(async (order) => order);

  const queryRunner = {
    isTransactionActive: true,
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn().mockImplementation(async () => {
      queryRunner.isTransactionActive = false;
    }),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      createQueryBuilder: jest.fn().mockReturnValue({
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(locked),
      }),
      findOne: jest.fn().mockResolvedValue(loaded),
      update: jest.fn().mockResolvedValue({}),
      save,
    },
  };

  return queryRunner;
}

describe('OrderService.markOrderAsPendingPayment', () => {
  const printerService = { printTicketOrder: jest.fn().mockResolvedValue('ok') };
  const eventEmitter = { emit: jest.fn() };
  let previousEnv: string | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env.NODE_ENV = previousEnv;
  });

  function buildService(queryRunner: ReturnType<typeof buildQueryRunner>) {
    const dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };
    return new OrderService(
      {} as any,
      {} as any,
      eventEmitter as unknown as EventEmitter2,
      {} as any,
      {} as any,
      dataSource as any,
      {} as any,
      printerService as any,
      {} as any,
    );
  }

  it('si falla el save de la orden hace rollback y no imprime', async () => {
    const queryRunner = buildQueryRunner({
      save: jest.fn().mockRejectedValue(new Error('order save failed')),
    });
    const service = buildService(queryRunner);

    await expect(service.markOrderAsPendingPayment(ORDER_ID)).rejects.toThrow(
      'order save failed',
    );

    expect(queryRunner.manager.update).toHaveBeenCalledWith(
      expect.anything(),
      'table-1',
      { state: TableState.PENDING_PAYMENT },
    );
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
    expect(printerService.printTicketOrder).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('commitea mesa y orden antes de imprimir', async () => {
    const queryRunner = buildQueryRunner({});
    const service = buildService(queryRunner);

    const result = await service.markOrderAsPendingPayment(ORDER_ID);

    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(printerService.printTicketOrder).toHaveBeenCalledTimes(1);
    const printOrder =
      printerService.printTicketOrder.mock.calls[0][0];
    expect(printOrder.state).toBe(OrderState.PENDING_PAYMENT);
    expect(printOrder.table.state).toBe(TableState.PENDING_PAYMENT);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'order.ticketPrinted',
      expect.objectContaining({ order: expect.objectContaining({ id: ORDER_ID }) }),
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'order.updatePending',
      expect.anything(),
    );
    expect(result.state).toBe(OrderState.PENDING_PAYMENT);
    expect(result.printerWarning).toBeNull();
  });

  it('si la impresora falla después del commit igual deja el pedido pendiente', async () => {
    printerService.printTicketOrder.mockRejectedValueOnce(new Error('down'));
    const queryRunner = buildQueryRunner({});
    const service = buildService(queryRunner);

    const result = await service.markOrderAsPendingPayment(ORDER_ID);

    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'order.printerError',
      expect.objectContaining({
        message: expect.stringContaining('Reimprimir ticket'),
      }),
    );
    expect(result.state).toBe(OrderState.PENDING_PAYMENT);
    expect(result.printerWarning).toContain('Reimprimir ticket');
  });
});
