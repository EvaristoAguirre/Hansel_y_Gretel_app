import { IConfirmedProducts } from "../Interfaces/IOrder";
import { SelectedProductsI } from "../Interfaces/IProducts";


/**
 * Mapea productIds con sus cantidades por productId base
 */
export const getUnitMap = (productIds: string[]): Record<string, number> => {
  const map: Record<string, number> = {};
  productIds.forEach((id) => {
    const [baseId] = id.split("-");
    map[baseId] = (map[baseId] || 0) + 1;
  });
  return map;
};

/**
 * Calcula el monto base según productos seleccionados y sus cantidades
 */
export const calculateBaseAmount = (
  unitMap: Record<string, number>,
  confirmedProducts: SelectedProductsI[]
): number => {
  return confirmedProducts.reduce((sum, p) => {
    const count = unitMap[p.productId] || 0;
    return sum + (p.unitaryPrice || 0) * count;
  }, 0);
};

/**
 * Aplica propina según tipo
 */
export const applyTip = (
  baseAmount: number,
  tipType: "none" | "10" | "custom",
  customTip: number
): number => {
  if (tipType === "10") return baseAmount * 1.1;
  if (tipType === "custom") return baseAmount + customTip;
  return baseAmount;
};

/**
 * Devuelve todas las unidades pendientes de pago
 */
export const getUnpaidUnitIds = (
  confirmedProducts: IConfirmedProducts[],
  confirmedPayments: { productIds: string[] }[]
): string[] => {
  const paidUnitIds = confirmedPayments.flatMap((p) => p.productIds);

  return confirmedProducts.flatMap((p) => {
    const quantity = p.quantity || 1;
    return Array.from({ length: quantity }, (_, index) => {
      const compositeId = `${p.productId}-${index}`;
      return paidUnitIds.includes(compositeId) ? null : compositeId;
    }).filter(Boolean) as string[];
  });
};
