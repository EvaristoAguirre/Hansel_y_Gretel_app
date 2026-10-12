import { promises as fsPromises } from 'fs';
import { REQUIRED_ARCHIVE_COLUMNS } from './archive.config';
import { ArchiveService } from './archive.service';

const ORDER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ORDER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function allColumns() {
  return Object.entries(REQUIRED_ARCHIVE_COLUMNS).flatMap(([table, columns]) =>
    columns.map((column) => ({ table_name: table, column_name: column })),
  );
}

function liveOrder(id: string, product: { id: string; name: string } | null) {
  return {
    id,
    date: new Date('2026-01-01T12:00:00.000Z'),
    state: 'closed',
    total: 1000,
    tip: 0,
    discountPercent: 0,
    discountAmount: 0,
    numberCustomers: 2,
    comment: null,
    createdAt: new Date('2026-01-01T12:00:00.000Z'),
    updatedAt: new Date('2026-01-01T13:00:00.000Z'),
    closedAt: new Date('2026-01-01T13:00:00.000Z'),
    table: { id: 'table-1', name: 'Mesa 1', room: { name: 'Salón' } },
    dailyCash: { id: 'cash-1', date: new Date('2026-01-01T03:00:00.000Z') },
    payments: [
      {
        id: `pay-${id}`,
        amount: 1000,
        methodOfPayment: 'efectivo',
        createdAt: new Date('2026-01-01T13:00:00.000Z'),
      },
    ],
    orderDetails: [
      {
        id: `detail-${id}`,
        quantity: 1,
        unitaryPrice: 1000,
        toppingsExtraCost: 0,
        subtotal: 1000,
        isActive: true,
        commentOfProduct: 'sin azúcar',
        commandNumber: '20260101-0001',
        product,
        orderDetailToppings: [],
        promotionSelections: [],
      },
    ],
  };
}

function createHarness(options?: {
  lock?: boolean;
  columns?: { table_name: string; column_name: string }[];
  candidateIds?: string[];
  orders?: Record<string, ReturnType<typeof liveOrder> | null>;
  alreadyArchived?: Set<string>;
  counts?: Record<
    string,
    {
      liveDetails: number;
      archDetails: number;
      livePayments: number;
      archPayments: number;
    }
  >;
  failHeaderInserts?: number;
  headerInsertError?: { code: string; message: string };
}) {
  const deleted: unknown[] = [];
  const errors: unknown[][] = [];
  const headerInserts: unknown[][] = [];
  let headerFailuresLeft = options?.failHeaderInserts ?? 0;
  const query = jest.fn(async (sql: string, params: unknown[] = []) => {
    if (sql.includes('pg_try_advisory_lock')) {
      return [{ locked: options?.lock ?? true }];
    }
    if (sql.includes('information_schema.columns')) {
      return options?.columns ?? allColumns();
    }
    if (sql.includes('INSERT INTO "archive_runs"')) return [];
    if (sql.includes('UPDATE "archive_runs"')) return [];
    if (sql.includes('AS cutoff')) {
      return [{ cutoff: new Date('2026-09-27T03:00:00.000Z') }];
    }
    if (sql.includes('ORDER BY date ASC')) {
      return (options?.candidateIds ?? []).map((id) => ({ id }));
    }
    if (sql.includes('FOR UPDATE')) {
      const id = String(params[0]);
      if (!(options?.candidateIds ?? []).includes(id)) return [];
      return [{ id, eligible: true }];
    }
    if (sql.includes('FROM "archived_orders" WHERE id')) {
      const id = String(params[0]);
      return options?.alreadyArchived?.has(id) ? [{ id }] : [];
    }
    if (sql.includes('liveDetails')) {
      const id = String(params[0]);
      return [
        options?.counts?.[id] ?? {
          liveDetails: 1,
          archDetails: 1,
          livePayments: 1,
          archPayments: 1,
        },
      ];
    }
    if (sql.includes('INSERT INTO "archived_orders"')) {
      if (headerFailuresLeft > 0) {
        headerFailuresLeft -= 1;
        const failure = options?.headerInsertError ?? {
          code: '40001',
          message: 'could not serialize',
        };
        throw Object.assign(new Error(failure.message), { code: failure.code });
      }
      headerInserts.push(params);
      return [];
    }
    if (sql.includes('INSERT INTO "archived_order_details"')) return [];
    if (sql.includes('INSERT INTO "archived_order_payments"')) return [];
    if (sql.includes('DELETE FROM "orders"')) {
      deleted.push(params[0]);
      return [];
    }
    if (sql.includes('DELETE FROM')) return [];
    if (sql.includes('INSERT INTO "archive_order_errors"')) {
      errors.push(params);
      return [];
    }
    if (sql.includes('pg_advisory_unlock')) return [];
    throw new Error(`SQL no contemplado: ${sql}`);
  });

  const queryRunner = {
    connect: jest.fn(),
    release: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    isTransactionActive: false,
    query,
    manager: {
      findOne: jest.fn(
        async (_entity: unknown, opts: { where: { id: string } }) => {
          return options?.orders?.[opts.where.id] ?? null;
        },
      ),
    },
  };
  queryRunner.startTransaction.mockImplementation(async () => {
    queryRunner.isTransactionActive = true;
  });
  queryRunner.commitTransaction.mockImplementation(async () => {
    queryRunner.isTransactionActive = false;
  });
  queryRunner.rollbackTransaction.mockImplementation(async () => {
    queryRunner.isTransactionActive = false;
  });

  const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
  const scheduler = {
    addCronJob: jest.fn(),
    getCronJob: jest.fn(() => ({ stop: jest.fn() })),
  };
  const dataSource = {
    createQueryRunner: jest.fn(() => queryRunner),
  };
  const config = { get: jest.fn().mockReturnValue(undefined) };
  const service = new ArchiveService(
    dataSource as any,
    config as any,
    logger as any,
    scheduler as any,
  );

  return {
    service,
    queryRunner,
    logger,
    scheduler,
    deleted,
    errors,
    headerInserts,
    query,
  };
}

function finishParams(query: jest.Mock) {
  const updates = query.mock.calls.filter((call) =>
    String(call[0]).includes('SET "finishedAt"'),
  );
  return updates.at(-1)?.[1] as unknown[] | undefined;
}

describe('ArchiveService.run', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(fsPromises, 'mkdir').mockResolvedValue(undefined);
    jest.spyOn(fsPromises, 'access').mockResolvedValue(undefined);
    jest.spyOn(fsPromises, 'writeFile').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sale si otra corrida ya tiene el lock y no borra órdenes', async () => {
    const harness = createHarness({ lock: false, candidateIds: [ORDER_A] });
    await harness.service.run('startup');
    expect(harness.logger.log).toHaveBeenCalledWith(
      expect.stringContaining('ya hay una corrida en curso'),
    );
    expect(harness.deleted).toEqual([]);
    expect(
      harness.query.mock.calls.some((call) =>
        String(call[0]).includes('information_schema'),
      ),
    ).toBe(false);
    expect(harness.queryRunner.release).toHaveBeenCalled();
  });

  it('si falta una columna de datos deja la corrida en failed y no borra', async () => {
    const harness = createHarness({
      columns: allColumns().filter(
        (column) => column.column_name !== 'tableName',
      ),
      candidateIds: [ORDER_A],
    });
    await harness.service.run('cron');
    const failedInsert = harness.query.mock.calls.find(
      (call) =>
        String(call[0]).includes('INSERT INTO "archive_runs"') &&
        String(call[0]).includes('"finishedAt"'),
    );
    expect(failedInsert?.[1][2]).toBe('failed');
    expect(String(failedInsert?.[1][3])).toContain('archived_orders.tableName');
    expect(harness.deleted).toEqual([]);
    expect(harness.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('status=failed'),
    );
  });

  it('si faltan las tablas de control no intenta escribir la corrida', async () => {
    const harness = createHarness({
      columns: allColumns().filter(
        (column) => column.table_name !== 'archive_runs',
      ),
    });
    await harness.service.run('startup');
    expect(
      harness.query.mock.calls.some((call) =>
        String(call[0]).includes('INSERT INTO "archive_runs"'),
      ),
    ).toBe(false);
    expect(harness.deleted).toEqual([]);
  });

  it('archiva la orden sana, omite la que no tiene producto y escribe el backup', async () => {
    const harness = createHarness({
      candidateIds: [ORDER_A, ORDER_B],
      orders: {
        [ORDER_A]: liveOrder(ORDER_A, null),
        [ORDER_B]: liveOrder(ORDER_B, { id: 'prod-1', name: 'Café' }),
      },
    });
    await harness.service.run('startup');

    expect(harness.headerInserts.map((params) => params[0])).toEqual([ORDER_B]);
    expect(harness.headerInserts[0][16]).toBe('Mesa 1');
    expect(harness.deleted).toEqual([ORDER_B]);
    expect(harness.errors[0][3]).toBe('NULL_PRODUCT');
    expect(harness.errors[0][2]).toBe(ORDER_A);
    const finished = finishParams(harness.query);
    expect(finished?.[1]).toBe('partial');
    expect(finished?.[2]).toBe(1);
    expect(finished?.[3]).toBe(1);
    expect(harness.logger.log).toHaveBeenCalledWith(
      '[ARCHIVE] trigger=startup status=partial archived=1 skipped=1 repaired=0',
    );
    const candidateSql = String(
      harness.query.mock.calls.find((call) =>
        String(call[0]).includes('ORDER BY date ASC'),
      )?.[0],
    );
    expect(candidateSql).toContain("'closed'");
    expect(candidateSql).toContain("'cancelled'");
    expect(candidateSql).not.toContain('pending_payment');
    expect(fsPromises.writeFile).toHaveBeenCalledWith(
      expect.stringMatching(
        /archived-orders-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/,
      ),
      expect.any(String),
      'utf-8',
    );
  });

  it('repara una copia ya completa borrando solo la orden viva', async () => {
    const harness = createHarness({
      candidateIds: [ORDER_A],
      alreadyArchived: new Set([ORDER_A]),
    });
    await harness.service.run('cron');
    expect(harness.headerInserts).toEqual([]);
    expect(harness.deleted).toEqual([ORDER_A]);
    expect(finishParams(harness.query)?.[1]).toBe('success');
    expect(finishParams(harness.query)?.[4]).toBe(1);
    expect(fsPromises.writeFile).not.toHaveBeenCalled();
  });

  it('no borra ninguno de los dos lados si la copia existente no coincide', async () => {
    const harness = createHarness({
      candidateIds: [ORDER_A],
      alreadyArchived: new Set([ORDER_A]),
      counts: {
        [ORDER_A]: {
          liveDetails: 2,
          archDetails: 1,
          livePayments: 1,
          archPayments: 1,
        },
      },
    });
    await harness.service.run('cron');
    expect(harness.deleted).toEqual([]);
    expect(harness.errors[0][3]).toBe('CONFLICT');
    expect(finishParams(harness.query)?.[1]).toBe('partial');
    expect(harness.queryRunner.commitTransaction).not.toHaveBeenCalled();
  });

  it('reintenta un deadlock y archiva en el segundo intento', async () => {
    const harness = createHarness({
      candidateIds: [ORDER_A],
      orders: { [ORDER_A]: liveOrder(ORDER_A, { id: 'prod-1', name: 'Café' }) },
      failHeaderInserts: 1,
    });
    await harness.service.run('cron');
    expect(harness.headerInserts).toHaveLength(1);
    expect(harness.deleted).toEqual([ORDER_A]);
    expect(harness.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('reintento 1'),
    );
    expect(finishParams(harness.query)?.[1]).toBe('success');
  });

  it('un error de columna aborta la corrida sin borrar esa orden', async () => {
    const harness = createHarness({
      candidateIds: [ORDER_A],
      orders: { [ORDER_A]: liveOrder(ORDER_A, { id: 'prod-1', name: 'Café' }) },
      failHeaderInserts: 1,
      headerInsertError: {
        code: '42703',
        message: 'column "tableName" does not exist',
      },
    });
    await harness.service.run('startup');
    expect(harness.deleted).toEqual([]);
    expect(harness.errors).toEqual([]);
    expect(finishParams(harness.query)?.[1]).toBe('failed');
    expect(harness.queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('con cero candidatas cierra en success', async () => {
    const harness = createHarness({ candidateIds: [] });
    await harness.service.run('cron');
    expect(finishParams(harness.query)).toEqual([
      expect.any(String),
      'success',
      0,
      0,
      0,
      null,
    ]);
    expect(harness.logger.log).toHaveBeenCalledWith(
      '[ARCHIVE] trigger=cron status=success archived=0 skipped=0 repaired=0',
    );
  });
});

describe('ArchiveService cron', () => {
  it('programa el sábado a las 14 en Argentina y dispara la corrida al arrancar', () => {
    jest.useFakeTimers();
    const harness = createHarness();
    const run = jest.spyOn(harness.service, 'run').mockResolvedValue(undefined);
    harness.service.onModuleInit();
    const job = harness.scheduler.addCronJob.mock.calls[0][1];
    expect(harness.scheduler.addCronJob.mock.calls[0][0]).toBe('archiveOrders');
    expect(job.cronTime.source).toBe('0 14 * * 6');
    expect(job.cronTime.timeZone).toBe('America/Argentina/Buenos_Aires');

    harness.service.onApplicationBootstrap();
    jest.advanceTimersByTime(59_999);
    expect(run).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(run).toHaveBeenCalledWith('startup');

    job.stop();
    harness.service.onModuleDestroy();
    jest.useRealTimers();
  });
});
