export type StockWsChange = {
  id: string;
  productId?: string;
  ingredientId?: string;
  quantityInStock: number;
  /** Epoch ms del stock al persistir. La UI descarta un snapshot más viejo. */
  updatedAt: number;
};

export type StockWsPayload = {
  stocks: StockWsChange[];
};

export function toStockWsChange(
  stock: {
    id: string;
    quantityInStock: number | string;
    updatedAt?: Date | string | number;
    product?: { id: string };
    ingredient?: { id: string };
  },
  ids?: { productId?: string; ingredientId?: string },
): StockWsChange {
  return {
    id: stock.id,
    productId: ids?.productId ?? stock.product?.id,
    ingredientId: ids?.ingredientId ?? stock.ingredient?.id,
    quantityInStock: Number(stock.quantityInStock),
    updatedAt: toStockVersion(stock.updatedAt),
  };
}

/** Última ocurrencia de cada id: en una promo el mismo stock puede aparecer dos veces. */
export function latestStockChanges(stocks: StockWsChange[]): StockWsChange[] {
  const latestById = new Map<string, StockWsChange>();
  for (const stock of stocks) {
    latestById.set(stock.id, stock);
  }
  return [...latestById.values()];
}

function toStockVersion(updatedAt?: Date | string | number): number {
  if (updatedAt instanceof Date && !Number.isNaN(updatedAt.getTime())) {
    return updatedAt.getTime();
  }
  if (typeof updatedAt === 'number' && Number.isFinite(updatedAt)) {
    return updatedAt;
  }
  if (typeof updatedAt === 'string') {
    const parsed = new Date(updatedAt).getTime();
    if (Number.isFinite(parsed)) return parsed;
  }
  return Date.now();
}
