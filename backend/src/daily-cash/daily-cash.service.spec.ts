import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConflictException } from '@nestjs/common';
import { DailyCashService } from './daily-cash.service';
import { DailyCashState, TableState } from 'src/Enums/states.enum';
import { PaymentMethod } from 'src/Enums/paymentMethod.enum';

const CASH_ID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

function buildService(deps: {
  dailyCashRepo: any;
  dataSource: any;
  tableService?: any;
  eventEmitter?: { emit: jest.Mock };
  dailyCashRepository?: any;
}) {
  return new DailyCashService(
    deps.dailyCashRepo,
    {} as any,
    deps.dailyCashRepository ?? {
      getDailyCashById: jest.fn().mockResolvedValue({
        id: CASH_ID,
        state: DailyCashState.OPEN,
        comment: 'nota',
        initialCash: 1000,
        movements: [],
        orders: [],
      }),
    },
    (deps.eventEmitter ?? { emit: jest.fn() }) as unknown as EventEmitter2,
    { log: jest.fn() } as any,
    deps.tableService ?? { getTablesWithActiveOrders: jest.fn().mockResolvedValue([]) },
    deps.dataSource,
  );
}

describe('DailyCashService.updateDailyCash', () => {
  it('ignora totales calculados y solo persiste comentario y efectivo inicial', async () => {
    const dailyCashRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: CASH_ID,
        state: DailyCashState.OPEN,
      }),
      update: jest.fn().mockResolvedValue({}),
    };
    const eventEmitter = { emit: jest.fn() };
    const service = buildService({
      dailyCashRepo,
      dataSource: {},
      eventEmitter,
    });

    await service.updateDailyCash(CASH_ID, {
      comment: 'apertura',
      initialCash: 5000,
      totalSales: 99999,
      totalCash: 1,
    } as any);

    expect(dailyCashRepo.update).toHaveBeenCalledWith(CASH_ID, {
      comment: 'apertura',
      initialCash: 5000,
    });
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'dailyCash.updated',
      expect.anything(),
    );
  });

  it('no escribe ni emite si el body solo trae totales', async () => {
    const dailyCashRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: CASH_ID,
        state: DailyCashState.OPEN,
      }),
      update: jest.fn(),
    };
    const eventEmitter = { emit: jest.fn() };
    const service = buildService({
      dailyCashRepo,
      dataSource: {},
      eventEmitter,
    });

    await service.updateDailyCash(CASH_ID, { totalSales: 10 } as any);

    expect(dailyCashRepo.update).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('rechaza cambiar el efectivo inicial de una caja cerrada', async () => {
    const dailyCashRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: CASH_ID,
        state: DailyCashState.CLOSED,
      }),
      update: jest.fn(),
    };
    const service = buildService({ dailyCashRepo, dataSource: {} });

    await expect(
      service.updateDailyCash(CASH_ID, { initialCash: 1 }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(dailyCashRepo.update).not.toHaveBeenCalled();
  });
});

describe('DailyCashService.closeDailyCash', () => {
  function buildQueryRunner(save: jest.Mock) {
    const openCash = {
      id: CASH_ID,
      state: DailyCashState.OPEN,
      comment: '',
      initialCash: 1000,
      date: new Date(),
      movements: [],
      orders: [
        {
          id: 'order-1',
          date: new Date(),
          state: 'closed',
          isActive: false,
          numberCustomers: 1,
          comment: null,
          total: 1000,
          tip: 0,
          discountPercent: 0,
          discountAmount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          closedAt: new Date(),
          payments: [{ amount: 1000, methodOfPayment: PaymentMethod.CASH }],
        },
      ],
    };

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
        findOne: jest
          .fn()
          .mockResolvedValueOnce({ id: CASH_ID, state: DailyCashState.OPEN })
          .mockResolvedValueOnce(openCash),
        save,
      },
    };
    return queryRunner;
  }

  it('si falla el save hace rollback y no emite el cierre', async () => {
    const queryRunner = buildQueryRunner(
      jest.fn().mockRejectedValue(new Error('cash save failed')),
    );
    const eventEmitter = { emit: jest.fn() };
    const service = buildService({
      dailyCashRepo: {},
      dataSource: { createQueryRunner: () => queryRunner },
      eventEmitter,
    });

    await expect(
      service.closeDailyCash(CASH_ID, { comment: '', finalCash: 2000 }),
    ).rejects.toThrow('cash save failed');

    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('si hay mesas activas no guarda ni emite el cierre', async () => {
    const queryRunner = buildQueryRunner(
      jest.fn().mockImplementation(async (cash) => cash),
    );
    const eventEmitter = { emit: jest.fn() };
    const service = buildService({
      dailyCashRepo: {},
      dataSource: { createQueryRunner: () => queryRunner },
      eventEmitter,
      tableService: {
        getTablesWithActiveOrders: jest.fn().mockResolvedValue([
          {
            tableName: 'Mesa 2',
            roomName: 'Salón',
            state: TableState.OPEN,
          },
        ]),
      },
    });

    await expect(
      service.closeDailyCash(CASH_ID, { comment: '', finalCash: 2000 }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(queryRunner.manager.save).not.toHaveBeenCalled();
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('con mesas libres guarda los totales dentro de la transacción', async () => {
    const queryRunner = buildQueryRunner(
      jest.fn().mockImplementation(async (cash) => cash),
    );
    const eventEmitter = { emit: jest.fn() };
    const service = buildService({
      dailyCashRepo: {},
      dataSource: { createQueryRunner: () => queryRunner },
      eventEmitter,
    });

    const result = await service.closeDailyCash(CASH_ID, {
      comment: 'ok',
      finalCash: 2000,
    });

    expect(queryRunner.manager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        state: DailyCashState.CLOSED,
        totalSales: 1000,
        totalCash: 1000,
        finalCash: 2000,
      }),
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'dailyCash.closed',
      expect.objectContaining({
        dailyCash: expect.objectContaining({ state: DailyCashState.CLOSED }),
      }),
    );
    expect(result.state).toBe(DailyCashState.CLOSED);
  });
});
