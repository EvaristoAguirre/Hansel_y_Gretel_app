import { OrderRepository } from './order.repository';
import { OrderState, TableState } from 'src/Enums/states.enum';
import { PaymentMethod } from 'src/Enums/paymentMethod.enum';
import { DailyCashState } from 'src/Enums/states.enum';

function buildPendingOrder() {
  return {
    id: 'order-1',
    isActive: true,
    state: OrderState.PENDING_PAYMENT,
    numberCustomers: 2,
    comment: null,
    orderDetails: [
      {
        id: 'detail-1',
        isActive: true,
        subtotal: 1000,
        quantity: 1,
        unitaryPrice: 1000,
        toppingsExtraCost: 0,
        commentOfProduct: null,
        product: { id: 'prod-1', name: 'Cafe', allowsToppings: false },
        orderDetailToppings: [],
      },
    ],
    table: {
      id: 'table-1',
      name: 'Mesa 1',
      state: TableState.PENDING_PAYMENT,
    },
    payments: [],
    total: 0,
    tip: 0,
    discountPercent: 0,
    discountAmount: 0,
  };
}

describe('OrderRepository.closeOrder', () => {
  const closeOrderDto = {
    total: 1000,
    payments: [{ amount: 1000, methodOfPayment: PaymentMethod.CASH }],
  };
  const openDailyCash = {
    id: 'cash-1',
    state: DailyCashState.OPEN,
  } as any;

  it('si falla el save de la orden hace rollback y no commitea', async () => {
    const queryRunner = {
      isTransactionActive: true,
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn().mockResolvedValue(buildPendingOrder()),
        create: jest.fn((_entity, payload) => payload),
        save: jest
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce({})
          .mockRejectedValueOnce(new Error('order save failed')),
      },
    };
    const dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };
    const repository = new OrderRepository({} as any, dataSource as any);

    await expect(
      repository.closeOrder('order-1', closeOrderDto, openDailyCash),
    ).rejects.toThrow('order save failed');

    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(queryRunner.manager.save).toHaveBeenCalledTimes(3);
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it('commitea pagos, mesa y orden en la misma transacción', async () => {
    const pending = buildPendingOrder();
    const closed = {
      ...pending,
      state: OrderState.CLOSED,
      table: { ...pending.table, state: TableState.AVAILABLE },
      payments: [{ amount: 1000, methodOfPayment: PaymentMethod.CASH }],
      total: 1000,
      tip: 0,
    };
    const queryRunner = {
      isTransactionActive: true,
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(pending)
          .mockResolvedValueOnce(closed),
        create: jest.fn((_entity, payload) => payload),
        save: jest.fn().mockResolvedValue({}),
      },
    };
    const dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };
    const repository = new OrderRepository({} as any, dataSource as any);

    const result = await repository.closeOrder(
      'order-1',
      closeOrderDto,
      openDailyCash,
    );

    expect(queryRunner.manager.save).toHaveBeenCalledTimes(3);
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(result.state).toBe(OrderState.CLOSED);
    expect(result.table.state).toBe(TableState.AVAILABLE);
  });
});
