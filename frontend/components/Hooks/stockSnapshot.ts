export type StockChange = {
  id: string;
  productId?: string;
  ingredientId?: string;
  quantityInStock: number;
  updatedAt?: number;
};

type StockHolder = {
  stock?: {
    id?: string;
    quantityInStock: string;
    stockUpdatedAt?: number;
  } | null;
};

/** La última entrada de cada id es la cantidad final del evento. */
export function latestStockChanges<T extends { id: string }>(stocks: T[]): T[] {
  return [...new Map(stocks.map((stock) => [stock.id, stock])).values()];
}

export function shouldApplyStockChange(
  currentUpdatedAt: number | undefined,
  incomingUpdatedAt: number | undefined,
): boolean {
  if (incomingUpdatedAt == null || Number.isNaN(incomingUpdatedAt)) {
    return currentUpdatedAt == null;
  }
  if (currentUpdatedAt == null) return true;
  return incomingUpdatedAt >= currentUpdatedAt;
}

export function patchStockQuantity<T extends StockHolder>(
  items: T[],
  stocks: StockChange[],
  match: (item: T, stock: StockChange) => boolean,
): T[] {
  const latest = latestStockChanges(stocks);
  return items.map((item) => {
    const change = latest.find((stock) => match(item, stock));
    if (!change || !item.stock) return item;
    if (!shouldApplyStockChange(item.stock.stockUpdatedAt, change.updatedAt)) {
      return item;
    }
    return {
      ...item,
      stock: {
        ...item.stock,
        quantityInStock: String(change.quantityInStock),
        stockUpdatedAt: change.updatedAt ?? item.stock.stockUpdatedAt,
      },
    };
  });
}
