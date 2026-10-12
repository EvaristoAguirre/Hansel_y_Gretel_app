import { buildArchiveInserts, ArchiveSourceOrder } from './archive.mapper';

function sourceOrder(
  overrides: Partial<ArchiveSourceOrder> = {},
): ArchiveSourceOrder {
  return {
    id: 'order-1',
    date: new Date('2026-01-02T15:00:00.000Z'),
    state: 'closed',
    total: 2500,
    tip: 100,
    discountPercent: 10,
    discountAmount: 200,
    numberCustomers: 3,
    comment: 'mesa adentro',
    createdAt: new Date('2026-01-02T15:00:00.000Z'),
    updatedAt: new Date('2026-01-02T16:00:00.000Z'),
    closedAt: new Date('2026-01-02T16:00:00.000Z'),
    table: { id: 'table-1', name: 'Ventana', room: { name: 'Salón' } },
    dailyCash: { id: 'cash-1', date: new Date('2026-01-02T03:00:00.000Z') },
    payments: [
      {
        id: 'pay-1',
        amount: 2500,
        methodOfPayment: 'efectivo',
        createdAt: new Date('2026-01-02T16:00:00.000Z'),
      },
    ],
    orderDetails: [
      {
        id: 'detail-1',
        quantity: 1,
        unitaryPrice: 2000,
        toppingsExtraCost: 0,
        subtotal: 2000,
        isActive: true,
        commentOfProduct: 'sin azúcar',
        commandNumber: '20260102-0010',
        product: {
          id: 'prod-1',
          name: 'Café',
          code: 12,
          categories: [{ name: 'Bebidas' }, { name: 'Calientes' }],
        },
        orderDetailToppings: [],
        promotionSelections: [
          {
            slotId: 'slot-1',
            slot: { name: 'Bebida' },
            selectedProductId: 'prod-2',
            selectedProduct: { name: 'Medialuna' },
            extraCostApplied: 0,
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('buildArchiveInserts', () => {
  const archivedAt = new Date('2026-10-17T17:00:00.000Z');

  it('copia la foto del producto, la mesa, la caja y el id del pago', () => {
    const plan = buildArchiveInserts(sourceOrder(), archivedAt);

    expect(plan.nullProductDetailIds).toEqual([]);
    expect(plan.headerParams[9]).toBeNull();
    expect(plan.headerParams[10]).toBe('efectivo');
    expect(plan.headerParams[16]).toBe('Ventana');
    expect(plan.headerParams[17]).toBe('Salón');
    expect(plan.headerParams[18]).toEqual(new Date('2026-01-02T03:00:00.000Z'));
    expect(plan.headerParams[13]).toEqual(new Date('2026-01-02T15:00:00.000Z'));
    expect(plan.headerParams[19]).toBe(archivedAt);
    expect(plan.headerParams[20]).toBe('archive');

    expect(plan.detailParams[0][10]).toBe('Café');
    expect(plan.detailParams[0][11]).toBe(12);
    expect(plan.detailParams[0][13]).toBe('sin azúcar');
    expect(JSON.parse(String(plan.detailParams[0][12]))).toEqual([
      'Bebidas',
      'Calientes',
    ]);
    expect(JSON.parse(String(plan.detailParams[0][9]))[0].slotName).toBe(
      'Bebida',
    );
    expect(plan.paymentParams[0][0]).toBe('pay-1');
    expect(plan.snapshot.commandNumber).toBeNull();
    expect(plan.snapshot.snapshotSource).toBe('archive');
  });

  it('deja el medio de pago de la cabecera vacío cuando el pago está partido', () => {
    const plan = buildArchiveInserts(
      sourceOrder({
        payments: [
          {
            id: 'pay-1',
            amount: 1000,
            methodOfPayment: 'efectivo',
            createdAt: new Date('2026-01-02T16:00:00.000Z'),
          },
          {
            id: 'pay-2',
            amount: 1500,
            methodOfPayment: 'transferencia',
            createdAt: new Date('2026-01-02T16:00:00.000Z'),
          },
        ],
      }),
      archivedAt,
    );
    expect(plan.headerParams[10]).toBeNull();
    expect(plan.paymentParams.map((params) => params[0])).toEqual([
      'pay-1',
      'pay-2',
    ]);
  });

  it('marca el ítem sin producto y no inventa un id', () => {
    const plan = buildArchiveInserts(
      sourceOrder({
        orderDetails: [
          {
            id: 'detail-vacio',
            quantity: 1,
            unitaryPrice: 0,
            toppingsExtraCost: 0,
            subtotal: 0,
            product: null,
          },
        ],
      }),
      archivedAt,
    );
    expect(plan.nullProductDetailIds).toEqual(['detail-vacio']);
    expect(plan.detailParams[0][5]).toBeNull();
  });

  it('advierte el extra de toppings vacío y el descuadre, y archiva igual', () => {
    const plan = buildArchiveInserts(
      sourceOrder({
        total: 3000,
        orderDetails: [
          {
            id: 'detail-1',
            quantity: 1,
            unitaryPrice: 2000,
            toppingsExtraCost: 1700,
            subtotal: 3700,
            product: { id: 'prod-1', name: 'Café', code: null, categories: [] },
            orderDetailToppings: [],
          },
        ],
      }),
      archivedAt,
    );
    expect(plan.nullProductDetailIds).toEqual([]);
    expect(plan.warnings.some((line) => line.includes('descuadre'))).toBe(true);
    expect(
      plan.warnings.some((line) => line.includes('toppingsExtraCost')),
    ).toBe(true);
    expect(plan.detailParams[0][5]).toBe('prod-1');
  });

  it('una orden cancelada sin mesa deja los nombres en null', () => {
    const plan = buildArchiveInserts(
      sourceOrder({ state: 'cancelled', table: null, dailyCash: null }),
      archivedAt,
    );
    expect(plan.headerParams[11]).toBeNull();
    expect(plan.headerParams[16]).toBeNull();
    expect(plan.headerParams[17]).toBeNull();
    expect(plan.headerParams[18]).toBeNull();
  });
});
