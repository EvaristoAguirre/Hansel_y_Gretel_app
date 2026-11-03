import { describe, expect, it } from 'vitest';
import {
  consumptionFromLines,
  discountAmountFromPercent,
  netAfterDiscount,
  remainingCents,
  totalWithTip,
} from './payTotals';

describe('payTotals', () => {
  it('neto con centavos: 100,40 y 10 % deja 90,36', () => {
    expect(discountAmountFromPercent(100.4, 10)).toBe(10.04);
    expect(netAfterDiscount(100.4, 10)).toBe(90.36);
  });

  it('suma unitaryPrice * quantity con cantidad mayor a 1', () => {
    expect(
      consumptionFromLines([
        { unitaryPrice: 50.2, quantity: 2 },
        { unitaryPrice: '10.00', quantity: 1 },
      ]),
    ).toBe(110.4);
  });

  it('el importe facturado es el neto tras descuento', () => {
    const consumption = consumptionFromLines([
      { unitaryPrice: 100.4, quantity: 1 },
    ]);
    const invoiceAmount = netAfterDiscount(consumption, 10);
    expect(invoiceAmount).toBe(90.36);
  });

  it('compara el restante en centavos', () => {
    expect(remainingCents(90.36, 90.36)).toBe(0);
    expect(remainingCents(90.36, 90)).toBe(36);
    expect(totalWithTip(90.36, '10', 0)).toBe(99.4);
  });
});
