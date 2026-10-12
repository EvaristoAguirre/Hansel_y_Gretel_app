import { ConflictException } from '@nestjs/common';
import { ArcaClient, ArcaSolicitarResult } from './arca-client';
import { AfipSettings } from './afip-config';
import { Invoice } from './invoice.entity';
import { InvoiceService } from './invoice.service';

const ORDER_A = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const ORDER_B = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

function order(id: string, subtotal = 1210) {
  return {
    id,
    tip: 100,
    discountAmount: 0,
    table: { name: '5' },
    orderDetails: [
      {
        isActive: true,
        subtotal,
        quantity: 1,
        unitaryPrice: subtotal,
        commentOfProduct: null,
        product: {
          id: 'prod',
          name: 'Café',
          allowsToppings: false,
          alicQuota: 21,
        },
        orderDetailToppings: [],
      },
    ],
  };
}

function settings(): AfipSettings {
  return {
    simulate: true,
    simulateResult: 'authorized',
    environment: null,
    mode: 'simulado',
    urls: null,
    cuit: null,
    ptoVta: 1,
    certPath: null,
    keyPath: null,
    alicuotaDefaultPct: 21,
    condicionIvaReceptorId: null,
    concepto: 1,
    razonSocial: 'Hansel y Gretel',
    domicilio: null,
    iibb: null,
    inicioActividades: null,
    timeoutMs: 8000,
  };
}

function harness(behavior: {
  solicitar: (cbteNro: number) => Promise<ArcaSolicitarResult>;
  consultar?: (
    cbteNro: number,
  ) => Promise<{ cae: string; caeFchVto: string } | null>;
  ultimo?: () => Promise<number>;
}) {
  const rows: Invoice[] = [];
  let seq = 0;
  const solicitar = jest.fn(async (input: { cbteNro: number }) =>
    behavior.solicitar(input.cbteNro),
  );
  const consultar = jest.fn(async (_p: number, _t: number, nro: number) =>
    behavior.consultar ? behavior.consultar(nro) : null,
  );
  const arca = {
    ultimoAutorizado: jest.fn(async () =>
      behavior.ultimo ? behavior.ultimo() : 0,
    ),
    solicitar,
    consultar,
    dummy: jest.fn(),
    getTiposIva: jest.fn(),
    getCondicionIvaReceptor: jest.fn(),
    getPtosVenta: jest.fn(),
  } as unknown as ArcaClient;

  const invoices = {
    create: (data: Partial<Invoice>) => ({ ...data }) as Invoice,
    save: jest.fn(async (row: Invoice) => {
      if (!row.id) {
        seq += 1;
        row.id = `inv-${seq}`;
        rows.push(row);
      }
      return row;
    }),
    findOne: jest.fn(
      async ({ where }: { where: { orderId?: string } }) =>
        rows.find((row) => row.orderId === where.orderId) ?? null,
    ),
    createQueryBuilder: () => {
      const api = {
        select: () => api,
        where: () => api,
        andWhere: () => api,
        getRawOne: async () => ({
          max: String(
            rows.reduce((max, row) => Math.max(max, row.cbteNro ?? 0), 0),
          ),
        }),
      };
      return api;
    },
  };

  const orders = {
    findOne: jest.fn(async ({ where }: { where: { id: string } }) => {
      if (where.id === ORDER_A) return order(ORDER_A);
      if (where.id === ORDER_B) return order(ORDER_B);
      return null;
    }),
  };

  const service = new InvoiceService(
    invoices as any,
    orders as any,
    { settings: settings() } as any,
    arca,
  );

  return { service, rows, solicitar, consultar };
}

describe('InvoiceService.emitForOrder', () => {
  it('autoriza y guarda el CAE', async () => {
    const { service, rows } = harness({
      solicitar: async (cbteNro) => ({
        outcome: 'authorized',
        cae: String(cbteNro).padStart(14, '0'),
        caeFchVto: '20261022',
        reproceso: false,
      }),
    });

    const view = await service.emitForOrder(ORDER_A, 'cliente@correo.com');

    expect(view.status).toBe('authorized');
    expect(view.cae).toBe('00000000000001');
    expect(view.afipEnv).toBe('simulado');
    expect(rows).toHaveLength(1);
    expect(rows[0].customerEmail).toBe('cliente@correo.com');
    expect(rows[0].status).toBe('authorized');
    expect(Number(rows[0].tipExcluded)).toBe(100);
  });

  it('un rechazo persiste el motivo y no autoriza', async () => {
    const { service, rows } = harness({
      solicitar: async () => ({
        outcome: 'rejected',
        errors: [{ code: 'SIM-R', msg: 'dato inválido' }],
      }),
    });

    const view = await service.emitForOrder(ORDER_A);
    expect(view.status).toBe('rejected');
    expect(view.message).toMatch(/dato inválido/);
    expect(rows[0].cae).toBeUndefined();
    expect(rows[0].arcaErrors).toEqual({
      errors: [{ code: 'SIM-R', msg: 'dato inválido' }],
    });
  });

  it('si el timeout igual dejó CAE, no vuelve a solicitar', async () => {
    const { service, rows, solicitar } = harness({
      solicitar: async () => ({ outcome: 'timeout' }),
      consultar: async () => ({ cae: '00000000000099', caeFchVto: '20261022' }),
    });

    const view = await service.emitForOrder(ORDER_A);
    expect(view.status).toBe('authorized');
    expect(view.cae).toBe('00000000000099');
    expect(solicitar).toHaveBeenCalledTimes(1);
    expect(rows[0].cbteNro).toBe(1);
  });

  it('si el timeout no dejó comprobante, queda pendiente con un solo número', async () => {
    const { service, rows } = harness({
      solicitar: async () => ({ outcome: 'timeout' }),
      consultar: async () => null,
    });

    const view = await service.emitForOrder(ORDER_A);
    expect(view.status).toBe('pending');
    expect(view.message).toMatch(/orden está cobrada/);
    expect(rows).toHaveLength(1);
    expect(rows[0].cbteNro).toBe(1);
  });

  it('dos emisiones simultáneas no repiten número', async () => {
    let last = 0;
    const { service, rows } = harness({
      ultimo: async () => {
        await new Promise((resolve) => setTimeout(resolve, 15));
        return last;
      },
      solicitar: async (cbteNro) => {
        last = cbteNro;
        return {
          outcome: 'authorized',
          cae: String(cbteNro).padStart(14, '0'),
          caeFchVto: '20261022',
          reproceso: false,
        };
      },
    });

    const [first, second] = await Promise.all([
      service.emitForOrder(ORDER_A),
      service.emitForOrder(ORDER_B),
    ]);

    expect(new Set([first.cbteNro, second.cbteNro])).toEqual(new Set([1, 2]));
    expect(rows).toHaveLength(2);
  });

  it('no crea una segunda factura para la misma orden', async () => {
    const { service, rows } = harness({
      solicitar: async (cbteNro) => ({
        outcome: 'authorized',
        cae: String(cbteNro).padStart(14, '0'),
        caeFchVto: '20261022',
        reproceso: false,
      }),
    });

    await service.emitForOrder(ORDER_A);
    await service.emitForOrder(ORDER_A);
    expect(rows).toHaveLength(1);
  });

  it('un importe cero no crea fila', async () => {
    const { service, rows } = harness({
      solicitar: async () => ({ outcome: 'timeout' }),
    });
    const orders = (service as any).orders;
    orders.findOne.mockResolvedValue(order(ORDER_A, 0));

    await expect(service.emitForOrder(ORDER_A)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(rows).toHaveLength(0);
  });
});
