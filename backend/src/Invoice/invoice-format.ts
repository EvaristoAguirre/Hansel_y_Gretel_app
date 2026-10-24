export function formatFiscalDate(value: string | null | undefined): string {
  if (!value) return '';
  const iso = String(value).slice(0, 10);
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return String(value);
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
