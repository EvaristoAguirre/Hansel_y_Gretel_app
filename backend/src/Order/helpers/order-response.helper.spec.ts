import { buildProductLines } from './order-response.helper';

describe('buildProductLines', () => {
  it('con toppings con cargo la suma de subtotales iguala detail.subtotal', () => {
    const detail = {
      id: 'd1',
      quantity: 2,
      unitaryPrice: 105.25,
      subtotal: 210.5,
      toppingsExtraCost: 10.5,
      commentOfProduct: null,
      product: {
        id: 'p1',
        name: 'Pizza',
        allowsToppings: true,
      },
      orderDetailToppings: [
        {
          unitIndex: 0,
          extraCost: 10.5,
          topping: { id: 't1', name: 'Extra queso' },
        },
        {
          unitIndex: 1,
          extraCost: 0,
          topping: { id: 't2', name: 'Sin cargo' },
        },
      ],
    };

    const lines = buildProductLines(detail as any);
    const sum = lines.reduce(
      (acc, line) => acc + Math.round(line.subtotal * 100),
      0,
    );
    expect(sum).toBe(Math.round(Number(detail.subtotal) * 100));
    expect(lines.every((line) => Number.isFinite(line.unitaryPrice))).toBe(
      true,
    );
    expect(lines.some((line) => !Number.isInteger(line.unitaryPrice))).toBe(
      true,
    );
  });
});
