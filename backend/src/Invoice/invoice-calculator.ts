import { alicuotaId } from './afip-alicuotas';

export class InvoiceCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvoiceCalculationError';
  }
}

export interface InvoiceLineInput {
  subtotal: number;
  /** Null usa el default del entorno. */
  alicQuota: number | null;
}

export interface InvoiceIvaBreakdown {
  id: number;
  quota: number;
  baseImp: number;
  importe: number;
}

export interface InvoiceAmounts {
  consumption: number;
  discountAmount: number;
  impTotal: number;
  impNeto: number;
  impIva: number;
  impTotConc: number;
  impOpEx: number;
  impTrib: number;
  iva: InvoiceIvaBreakdown[];
}

export function calculateInvoice(input: {
  lines: InvoiceLineInput[];
  discountAmount: number;
  defaultAlicuotaPct: number;
}): InvoiceAmounts {
  const groups = new Map<number, number>();
  let consumptionCents = 0;

  for (const line of input.lines) {
    const subtotalCents = toCents(line.subtotal);
    if (subtotalCents < 0) {
      throw new InvoiceCalculationError(
        'Una línea de la factura tiene subtotal negativo.',
      );
    }
    const quota = line.alicQuota ?? input.defaultAlicuotaPct;
    alicuotaId(quota);
    consumptionCents += subtotalCents;
    groups.set(quota, (groups.get(quota) ?? 0) + subtotalCents);
  }

  const discountCents = toCents(input.discountAmount);
  if (discountCents < 0) {
    throw new InvoiceCalculationError('El descuento no puede ser negativo.');
  }

  const totalCents = consumptionCents - discountCents;
  if (totalCents <= 0) {
    throw new InvoiceCalculationError('No se puede facturar un importe cero.');
  }

  const ordered = [...groups.entries()].sort((a, b) => a[0] - b[0]);
  const discountByQuota = prorate(ordered, discountCents, consumptionCents);

  const iva: InvoiceIvaBreakdown[] = [];
  let impNetoCents = 0;
  let impIvaCents = 0;

  for (const [quota, subtotalCents] of ordered) {
    const baseCents = subtotalCents - (discountByQuota.get(quota) ?? 0);
    if (baseCents <= 0) continue;
    const netoCents = Math.round(baseCents / (1 + quota / 100));
    const ivaCents = baseCents - netoCents;
    impNetoCents += netoCents;
    impIvaCents += ivaCents;
    iva.push({
      id: alicuotaId(quota),
      quota,
      baseImp: fromCents(netoCents),
      importe: fromCents(ivaCents),
    });
  }

  return {
    consumption: fromCents(consumptionCents),
    discountAmount: fromCents(discountCents),
    impTotal: fromCents(totalCents),
    impNeto: fromCents(impNetoCents),
    impIva: fromCents(impIvaCents),
    impTotConc: 0,
    impOpEx: 0,
    impTrib: 0,
    iva,
  };
}

function prorate(
  ordered: [number, number][],
  discountCents: number,
  consumptionCents: number,
): Map<number, number> {
  const shares = new Map<number, number>();
  let assigned = 0;
  ordered.forEach(([quota, subtotalCents], index) => {
    if (index === ordered.length - 1) {
      shares.set(quota, discountCents - assigned);
      return;
    }
    const share = Math.round(
      (discountCents * subtotalCents) / consumptionCents,
    );
    shares.set(quota, share);
    assigned += share;
  });
  return shares;
}

function toCents(value: number): number {
  if (!Number.isFinite(value)) {
    throw new InvoiceCalculationError('Hay un importe que no es un número.');
  }
  return Math.round(value * 100);
}

function fromCents(cents: number): number {
  return cents / 100;
}
