import { normalizeNumber } from '../Utils/NormalizeNumber';

type PricedLine = {
  unitaryPrice?: number | string | null;
  quantity?: number;
};

export function sumOrderLines(
  products: PricedLine[] | null | undefined,
): number {
  if (!products?.length) return 0;
  return products.reduce((acc, item) => {
    return acc + normalizeNumber(item.unitaryPrice ?? 0) * (item.quantity ?? 0);
  }, 0);
}
