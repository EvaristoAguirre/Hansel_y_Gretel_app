/** Deja solo dígitos y un punto decimal, con hasta 2 centavos. La coma cuenta como punto. */
export function sanitizeTipInput(value: string): string {
  const source = value.replace(/,/g, '.');
  let intPart = '';
  let decimals: string | null = null;

  for (const ch of source) {
    if (ch >= '0' && ch <= '9') {
      if (decimals === null) intPart += ch;
      else if (decimals.length < 2) decimals += ch;
    } else if (ch === '.' && decimals === null) {
      decimals = '';
    }
  }

  if (decimals === null) return intPart;
  return `${intPart}.${decimals}`;
}

/** Entero en pesos. El punto separa centavos: "550" → 550, "550.75" → 550.75, "550.00" → 550. */
export function parseTipInput(value: string): number {
  const sanitized = sanitizeTipInput(value);
  if (!sanitized || sanitized === '.') return 0;
  const n = parseFloat(sanitized);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

/** Muestra pesos. Sin centavos no agrega decimales: 550 → "550", 550.75 → "550,75". */
export function formatTipAmount(value: number): string {
  const cents = Math.max(0, Math.round((value || 0) * 100));
  const hasCents = cents % 100 !== 0;
  return (cents / 100).toLocaleString('es-AR', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  });
}

/** Texto editable con punto decimal, listo para seguir escribiendo. */
export function tipToEditString(value: number): string {
  const cents = Math.max(0, Math.round((value || 0) * 100));
  if (cents === 0) return '';
  const pesos = Math.floor(cents / 100);
  const dec = cents % 100;
  if (dec === 0) return String(pesos);
  return `${pesos}.${String(dec).padStart(2, '0')}`;
}
