import { latestStockChanges, toStockWsChange } from './stock-ws.payload';

describe('stock-ws.payload', () => {
  it('latestStockChanges conserva la última cantidad de cada id', () => {
    const collapsed = latestStockChanges([
      {
        id: 'stock-1',
        productId: 'prod-1',
        quantityInStock: 9,
        updatedAt: 1,
      },
      {
        id: 'stock-1',
        productId: 'prod-1',
        quantityInStock: 8,
        updatedAt: 2,
      },
      {
        id: 'stock-2',
        ingredientId: 'ing-1',
        quantityInStock: 4,
        updatedAt: 2,
      },
    ]);

    expect(collapsed).toEqual([
      {
        id: 'stock-1',
        productId: 'prod-1',
        quantityInStock: 8,
        updatedAt: 2,
      },
      {
        id: 'stock-2',
        ingredientId: 'ing-1',
        quantityInStock: 4,
        updatedAt: 2,
      },
    ]);
  });

  it('toStockWsChange usa updatedAt del stock como epoch', () => {
    const change = toStockWsChange(
      {
        id: 'stock-1',
        quantityInStock: '8.00',
        updatedAt: new Date('2026-09-24T12:00:00.000Z'),
      },
      { productId: 'prod-1' },
    );

    expect(change).toEqual({
      id: 'stock-1',
      productId: 'prod-1',
      ingredientId: undefined,
      quantityInStock: 8,
      updatedAt: Date.parse('2026-09-24T12:00:00.000Z'),
    });
  });
});
