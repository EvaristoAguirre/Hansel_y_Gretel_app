import { describe, expect, it } from 'vitest';
import { patchStockQuantity, StockChange } from './stockSnapshot';

const product = {
  id: 'prod-1',
  stock: {
    id: 'stock-1',
    quantityInStock: '10',
    minimumStock: '0',
    unitOfMeasure: { id: 'u', name: 'un', abbreviation: 'un' },
    stockUpdatedAt: undefined as number | undefined,
  },
};

describe('patchStockQuantity', () => {
  it('se queda con la última cantidad cuando el mismo stock viene dos veces', () => {
    const stocks: StockChange[] = [
      { id: 'stock-1', productId: 'prod-1', quantityInStock: 9, updatedAt: 1 },
      { id: 'stock-1', productId: 'prod-1', quantityInStock: 8, updatedAt: 2 },
    ];

    const [patched] = patchStockQuantity([product], stocks, (item, stock) =>
      stock.productId === item.id || stock.id === item.stock?.id,
    );

    expect(patched.stock?.quantityInStock).toBe('8');
    expect(patched.stock?.stockUpdatedAt).toBe(2);
  });

  it('ignora un snapshot más viejo que el que ya muestra la UI', () => {
    const current = {
      ...product,
      stock: { ...product.stock, quantityInStock: '8', stockUpdatedAt: 20 },
    };
    const stocks: StockChange[] = [
      { id: 'stock-1', productId: 'prod-1', quantityInStock: 9, updatedAt: 10 },
    ];

    const [patched] = patchStockQuantity([current], stocks, (item, stock) =>
      stock.productId === item.id,
    );

    expect(patched.stock?.quantityInStock).toBe('8');
    expect(patched.stock?.stockUpdatedAt).toBe(20);
  });

  it('aplica un snapshot más nuevo', () => {
    const current = {
      ...product,
      stock: { ...product.stock, quantityInStock: '9', stockUpdatedAt: 10 },
    };
    const stocks: StockChange[] = [
      { id: 'stock-1', productId: 'prod-1', quantityInStock: 8, updatedAt: 20 },
    ];

    const [patched] = patchStockQuantity([current], stocks, (item, stock) =>
      stock.productId === item.id,
    );

    expect(patched.stock?.quantityInStock).toBe('8');
    expect(patched.stock?.stockUpdatedAt).toBe(20);
  });
});
