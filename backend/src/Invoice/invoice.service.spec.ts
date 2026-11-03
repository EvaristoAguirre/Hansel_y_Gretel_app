import { ConflictException } from '@nestjs/common';
import { renderInvoicePdf } from './invoice-pdf';
import { ArcaClient, ArcaSolicitarResult } from './arca-client';
import { AfipSettings } from './afip-config';
import { Invoice } from './invoice.entity';
import { argentinaIsoDate, InvoiceService } from './invoice.service';

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
        toppingsExtraCost: 0,
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

function settings(overrides: Partial<AfipSettings> = {}): AfipSettings {
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
    ...overrides,
  };
}

function harness(
  behavior: {
    solicitar: (cbteNro: number) => Promise<ArcaSolicitarResult>;
    consultar?: (
      cbteNro: number,
    ) => Promise<{
      cae: string;
      caeFchVto: string;
      impTotal?: number;
      cbteFch?: string | null;
    } | null>;
    ultimo?: () => Promise<number>;
  },
  source: {
    orderA?: ReturnType<typeof order>;
    orderB?: ReturnType<typeof order>;
    afip?: Partial<AfipSettings>;
  } = {},
) {
  const rows: Invoice[] = [];
  let seq = 0;
  const solicitar = jest.fn(async (input: { cbteNro: number }) =>
    behavior.solicitar(input.cbteNro),
  );
  const consultar = jest.fn(async (_p: number, _t: number, nro: number) => {
    if (!behavior.consultar) return null;
    const found = await behavior.consultar(nro);
    if (!found) return null;
    return {
      ptoVta: 1,
      cbteTipo: 6,
      cbteNro: nro,
      cae: found.cae,
      caeFchVto: found.caeFchVto,
      impTotal: found.impTotal ?? 1210,
      cbteFch: found.cbteFch ?? argentinaIsoDate().replace(/-/g, ''),
    };
  });
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
      } else if (!rows.find((r) => r.id === row.id)) {
        rows.push(row);
      }
      return row;
    }),
    findOne: jest.fn(
      async ({
        where,
      }: {
        where: {
          orderId?: string;
          id?: string;
          afipEnv?: string;
          ptoVta?: number;
          cbteTipo?: number;
          cbteNro?: number;
          status?: string;
        };
      }) => {
        if (where.id) return rows.find((row) => row.id === where.id) ?? null;
        if (where.orderId) {
          return rows.find((row) => row.orderId === where.orderId) ?? null;
        }
        if (where.cbteNro != null) {
          return (
            rows.find(
              (row) =>
                row.cbteNro === where.cbteNro &&
                row.afipEnv === where.afipEnv &&
                row.ptoVta === where.ptoVta &&
                row.cbteTipo === where.cbteTipo &&
                row.status === where.status,
            ) ?? null
          );
        }
        return null;
      },
    ),
  };

  const orders = {
    findOne: jest.fn(async ({ where }: { where: { id: string } }) => {
      if (where.id === ORDER_A) return source.orderA ?? order(ORDER_A);
      if (where.id === ORDER_B) return source.orderB ?? order(ORDER_B);
      return null;
    }),
  };

  const service = new InvoiceService(
    invoices as any,
    orders as any,
    { settings: settings(source.afip) } as any,
    arca,
  );

  return { service, rows, solicitar, consultar, arca, orders };
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
      consultar: async () => ({
        cae: '00000000000099',
        caeFchVto: '20261022',
        impTotal: 1210,
        cbteFch: argentinaIsoDate().replace(/-/g, ''),
      }),
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

  it('reintenta una rechazada y, si el modo no coincide, no la reenvía', async () => {
    let calls = 0;
    const { service, rows } = harness({
      solicitar: async (cbteNro) => {
        calls += 1;
        if (calls === 1) {
          return {
            outcome: 'rejected',
            errors: [{ code: '1', msg: 'mal' }],
          };
        }
        return {
          outcome: 'authorized',
          cae: String(cbteNro).padStart(14, '0'),
          caeFchVto: '20261022',
          reproceso: false,
        };
      },
      consultar: async () => null,
    });

    const first = await service.emitForOrder(ORDER_A);
    const retried = await service.retry(first.id);
    expect(retried.status).toBe('authorized');

    rows[0].afipEnv = 'homologacion';
    rows[0].status = 'rejected';
    await expect(service.retry(first.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('dos alícuotas quedan en el detalle y en el PDF', async () => {
    const mixed = order(ORDER_A, 1210);
    mixed.orderDetails.push({
      isActive: true,
      subtotal: 1105,
      quantity: 1,
      unitaryPrice: 1105,
      toppingsExtraCost: 0,
      commentOfProduct: null,
      product: {
        id: 'prod-2',
        name: 'Agua',
        allowsToppings: false,
        alicQuota: 10.5,
      },
      orderDetailToppings: [],
    });
    const { service, rows } = harness(
      {
        solicitar: async (cbteNro) => ({
          outcome: 'authorized',
          cae: String(cbteNro).padStart(14, '0'),
          caeFchVto: '20261022',
          reproceso: false,
        }),
      },
      { orderA: mixed },
    );

    await service.emitForOrder(ORDER_A);
    const quotas = (rows[0].iva ?? []).map((item) => item.quota).sort();
    expect(quotas).toEqual([10.5, 21]);

    const text = (await renderInvoicePdf(rows[0])).toString('latin1');
    const decoded = [...text.matchAll(/<([0-9A-Fa-f]+)>/g)]
      .map((match) => Buffer.from(match[1], 'hex').toString('latin1'))
      .join('');
    expect(decoded).toContain('21 %');
    expect(decoded).toContain('10,5 %');
  });

  it('una factura manual no abre orden ni mueve la caja', async () => {
    const { service, rows } = harness({
      solicitar: async (cbteNro) => ({
        outcome: 'authorized',
        cae: String(cbteNro).padStart(14, '0'),
        caeFchVto: '20261022',
        reproceso: false,
      }),
    });

    const view = await service.emitManual({
      lines: [
        { concept: 'Café de paso', quantity: 2, unitPrice: 500, alicQuota: 21 },
      ],
      discountAmount: 100,
      customerEmail: 'mesa@example.com',
    });

    expect(view.status).toBe('authorized');
    expect(rows).toHaveLength(1);
    expect(rows[0].origin).toBe('manual');
    expect(rows[0].orderId).toBeNull();
    expect(rows[0].tipExcluded).toBe('0.00');
    expect(rows[0].impTotal).toBe('900.00');
    expect(rows[0].customerEmail).toBe('mesa@example.com');
  });

  it('un importe cero no crea fila', async () => {
    const { service, rows } = harness({
      solicitar: async () => ({ outcome: 'timeout' }),
    });
    const orders = (service as any).orders;
    orders.findOne.mockResolvedValue(order(ORDER_A, 0));

    const view = await service.emitForOrder(ORDER_A);
    expect(view.status).toBe('pending');
    expect(view.id).toBeTruthy();
    expect(rows).toHaveLength(1);
    expect(rows[0].cbteNro).toBeNull();
    expect(view.message).toMatch(/importe cero|No se puede facturar/i);
  });

  it('tras un rechazo la siguiente factura reutiliza el número que ARCA espera', async () => {
    let ultimo = 0;
    const { service, rows, solicitar } = harness({
      ultimo: async () => ultimo,
      solicitar: async (cbteNro) => {
        if (cbteNro === 1 && solicitar.mock.calls.length === 1) {
          return {
            outcome: 'rejected',
            errors: [{ code: '1', msg: 'dato inválido' }],
          };
        }
        return {
          outcome: 'authorized',
          cae: String(cbteNro).padStart(14, '0'),
          caeFchVto: '20261022',
          reproceso: false,
        };
      },
      consultar: async () => null,
    });

    const first = await service.emitForOrder(ORDER_A);
    expect(first.status).toBe('rejected');
    expect(rows[0].cbteNro).toBe(1);

    const second = await service.emitForOrder(ORDER_B);
    expect(second.status).toBe('authorized');
    expect(second.cbteNro).toBe(1);
    expect(rows[0].cbteNro).toBeNull();
    expect(
      (rows[0].arcaErrors as { releasedCbteNro?: number }).releasedCbteNro,
    ).toBe(1);
  });

  it('con un pendiente sin CAE no emite un número nuevo', async () => {
    const { service, rows } = harness({
      solicitar: async () => ({ outcome: 'timeout' }),
      consultar: async () => null,
    });

    const first = await service.emitForOrder(ORDER_A);
    expect(first.status).toBe('pending');
    expect(first.cbteNro).toBe(1);

    const second = await service.emitForOrder(ORDER_B);
    expect(second.status).toBe('pending');
    expect(second.cbteNro).toBeNull();
    expect(second.message).toMatch(/pendiente/i);
    expect(rows.filter((r) => r.cbteNro === 1)).toHaveLength(1);
  });

  it('si la consulta del reintento falla no pasa a rejected', async () => {
    const { service, rows, consultar, solicitar } = harness({
      solicitar: async () => ({ outcome: 'timeout' }),
      consultar: async () => {
        throw new Error('token caído');
      },
    });

    const first = await service.emitForOrder(ORDER_A);
    expect(first.status).toBe('pending');
    const solicitarCalls = solicitar.mock.calls.length;

    const retried = await service.retry(first.id);
    expect(retried.status).toBe('pending');
    expect(solicitar.mock.calls.length).toBe(solicitarCalls);
    expect(consultar).toHaveBeenCalled();
    expect(
      (rows[0].arcaErrors as { errors: { code: string }[] }).errors[0].code,
    ).toBe('CONSULTA');

    consultar.mockResolvedValueOnce({
      ptoVta: 1,
      cbteTipo: 6,
      cbteNro: 1,
      cae: '00000000000077',
      caeFchVto: '20261022',
      impTotal: 1210,
      cbteFch: argentinaIsoDate().replace(/-/g, ''),
    });
    const recovered = await service.retry(first.id);
    expect(recovered.status).toBe('authorized');
    expect(recovered.cae).toBe('00000000000077');
  });

  it('si el CAE consultado no coincide en importe no autoriza', async () => {
    const { service, rows } = harness({
      solicitar: async () => ({ outcome: 'timeout' }),
      consultar: async () => ({
        cae: '00000000000055',
        caeFchVto: '20261022',
        impTotal: 9999,
        cbteFch: argentinaIsoDate().replace(/-/g, ''),
      }),
    });

    const view = await service.emitForOrder(ORDER_A);
    expect(view.status).toBe('pending');
    expect(rows[0].cae).toBeUndefined();
    expect(
      (rows[0].arcaErrors as { errors: { code: string }[] }).errors[0].code,
    ).toBe('MISMATCH');
  });

  it('cbteFch usa la fecha civil de Argentina', async () => {
    const { service, rows } = harness({
      solicitar: async (cbteNro) => ({
        outcome: 'authorized',
        cae: String(cbteNro).padStart(14, '0'),
        caeFchVto: '20261022',
        reproceso: false,
      }),
    });

    // 2026-11-04 02:30 UTC = 2026-11-03 23:30 en Argentina.
    const utcLate = new Date('2026-11-04T02:30:00.000Z');
    expect(argentinaIsoDate(utcLate)).toBe('2026-11-03');

    await service.emitForOrder(ORDER_A);
    expect(rows[0].cbteFch).toBe(argentinaIsoDate());
  });
});

describe('argentinaIsoDate', () => {
  it('antes de la medianoche argentina no salta de día', () => {
    expect(argentinaIsoDate(new Date('2026-11-04T02:30:00.000Z'))).toBe(
      '2026-11-03',
    );
  });
});
