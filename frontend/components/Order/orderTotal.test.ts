import { describe, expect, it } from 'vitest';
import { lineTotalWithExtras, sumOrderLines, sumSlotExtras } from './orderTotal';

describe('sumOrderLines', () => {
  it('devuelve 0 si no hay productos', () => {
    expect(sumOrderLines([])).toBe(0);
    expect(sumOrderLines(undefined)).toBe(0);
  });

  it('suma precio por cantidad', () => {
    expect(
      sumOrderLines([
        { unitaryPrice: 1500, quantity: 2 },
        { unitaryPrice: '500', quantity: 1 },
      ]),
    ).toBe(3500);
  });
});

describe('sumSlotExtras', () => {
  it('suma el extra de la opción y el de los agregados', () => {
    expect(
      sumSlotExtras([
        { extraCost: 5000, toppingsExtraCost: 2000 },
        { extraCost: 0, toppingsExtraCost: 1500 },
      ]),
    ).toBe(8500);
  });
});

describe('lineTotalWithExtras', () => {
  it('muestra el precio base más extras antes de guardar el pedido', () => {
    expect(
      lineTotalWithExtras(
        {
          unitaryPrice: 20000,
          quantity: 1,
          slotSelections: [{ extraCost: 5000, toppingsExtraCost: 2000 }],
        },
        0,
      ),
    ).toBe(27000);
  });

  it('repite el extra del slot por cada unidad', () => {
    expect(
      lineTotalWithExtras(
        {
          unitaryPrice: '20000',
          quantity: 2,
          slotSelections: [{ extraCost: 5000 }],
        },
        1000,
      ),
    ).toBe(51000);
  });
});
