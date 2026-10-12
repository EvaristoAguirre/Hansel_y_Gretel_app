import { normalizeNumber } from '../Utils/NormalizeNumber';

type SlotExtra = {
  extraCost?: number | string | null;
  toppingsExtraCost?: number | string | null;
};

type PricedLine = {
  unitaryPrice?: number | string | null;
  quantity?: number;
  slotSelections?: SlotExtra[] | null;
};

/** Extra de una promo: opciones de slot más agregados elegidos dentro del modal. */
export function sumSlotExtras(selections: SlotExtra[] | null | undefined): number {
  if (!selections?.length) return 0;
  return selections.reduce((sum, selection) => {
    return (
      sum +
      normalizeNumber(selection.extraCost ?? 0) +
      normalizeNumber(selection.toppingsExtraCost ?? 0)
    );
  }, 0);
}

/**
 * Total de una línea sin confirmar.
 * El extra del slot va en el precio unitario (igual que al guardar el pedido).
 * `toppingExtra` ya está sumado por unidad para los agregados del producto.
 */
export function lineTotalWithExtras(
  product: PricedLine,
  toppingExtra = 0,
): number {
  const quantity = product.quantity ?? 0;
  const unit = normalizeNumber(product.unitaryPrice ?? 0) + sumSlotExtras(product.slotSelections);
  return unit * quantity + toppingExtra;
}

export function sumOrderLines(
  products: PricedLine[] | null | undefined,
): number {
  if (!products?.length) return 0;
  return products.reduce((acc, item) => {
    return acc + normalizeNumber(item.unitaryPrice ?? 0) * (item.quantity ?? 0);
  }, 0);
}
