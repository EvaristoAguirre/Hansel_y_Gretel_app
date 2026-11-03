/**
 * Fecha civil AAAA-MM-DD. `pg` entrega las columnas `date` como `Date` a
 * medianoche local; `String(date)` no es esa forma.
 */
export function civilDate(value: string | Date | null | undefined): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const text = String(value ?? '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

export function formatFiscalDate(
  value: string | Date | null | undefined,
): string {
  if (!value) return '';
  const iso = civilDate(value);
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return value instanceof Date ? '' : String(value);
}

export function formatFiscalMoney(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const negative = safe < 0;
  const [whole, frac] = Math.abs(safe).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}$ ${grouped},${frac}`;
}

export function formatQuota(value: number): string {
  return `${String(value).replace('.', ',')} %`;
}

export function fiscalLegend(afipEnv: string): string | null {
  if (afipEnv === 'simulado') {
    return 'COMPROBANTE SIMULADO - SIN VALIDEZ FISCAL';
  }
  if (afipEnv === 'homologacion') {
    return 'COMPROBANTE DE HOMOLOGACIÓN - SIN VALIDEZ FISCAL';
  }
  return null;
}

export function comprobanteNumero(ptoVta: number, cbteNro: number): string {
  return `${String(ptoVta).padStart(4, '0')}-${String(cbteNro).padStart(8, '0')}`;
}
