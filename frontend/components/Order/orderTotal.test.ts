import { describe, expect, it } from 'vitest';
import { sumOrderLines } from './orderTotal';

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
