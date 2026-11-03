import { parseEsARNumber } from '../Utils/FormatNumber';

export type PayLine = {
  unitaryPrice?: number | string | null;
  quantity?: number;
};

/**
 * Consumo en pesos (centavos). Usa unitaryPrice * quantity por línea.
 */
export function consumptionFromLines(lines: PayLine[]): number {
  if (!lines.length) return 0;
  const cents = lines.reduce((sum, line) => {
    const unit = parseEsARNumber(line.unitaryPrice ?? 0);
    const qty = line.quantity ?? 1;
    return sum + Math.round(unit * qty * 100);
  }, 0);
  return cents / 100;
}

/** Descuento porcentual redondeado al centavo, misma regla que el backend. */
export function discountAmountFromPercent(
  consumption: number,
  discountPercent: number,
): number {
  const consumptionCents = Math.round(consumption * 100);
  const pct = Math.min(100, Math.max(0, Math.round(discountPercent || 0)));
  if (pct === 0) return 0;
  return Math.round((consumptionCents * pct) / 100) / 100;
}

export function netAfterDiscount(
  consumption: number,
  discountPercent: number,
): number {
  const discount = discountAmountFromPercent(consumption, discountPercent);
  return Math.round((consumption - discount) * 100) / 100;
}

export function totalWithTip(
  net: number,
  tipType: 'none' | '10' | 'custom',
  customTip: number,
): number {
  if (tipType === '10') {
    return Math.round(net * 1.1 * 100) / 100;
  }
  if (tipType === 'custom') {
    return Math.round((net + customTip) * 100) / 100;
  }
  return net;
}

/** Diferencia en centavos entre total a pagar e ingresado. */
export function remainingCents(total: number, paid: number): number {
  return Math.round(total * 100) - Math.round(paid * 100);
}
