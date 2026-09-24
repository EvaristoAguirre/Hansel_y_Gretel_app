export type StockWsChange = {
  id: string;
  productId?: string;
  ingredientId?: string;
  quantityInStock: number;
};

export type StockWsPayload = {
  stocks: StockWsChange[];
};

export function toStockWsChange(
  stock: {
    id: string;
    quantityInStock: number | string;
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
  };
}
