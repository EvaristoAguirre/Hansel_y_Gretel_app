export function formatNumber(value: number): string {
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Interpreta números en es-AR ("1.234", "10,5") y también strings de API con
 * punto decimal inglés por toFixed ("10.00", "1360.00"). No eliminar todos
 * los puntos en el segundo caso: "10.00" pasaría a "1000".
 */
export function parseEsARNumber(
  value: string | number | null | undefined
): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const s = String(value).trim();
  if (!s) return 0;

  if (s.includes(',')) {
    const normalized = s.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(normalized);
    return Number.isFinite(n) ? n : 0;
  }

  // Miles con punto y grupos de 3 ("1.360", "136.000"); no confundir con "10.00".
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    const n = parseFloat(s.replace(/\./g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}
