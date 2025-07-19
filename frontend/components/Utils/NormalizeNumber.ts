export function normalizeNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (!value) return 0;

  // Reemplazar miles (.) por nada y coma (,) por punto para formato AR
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(normalized);

  return isNaN(parsed) ? 0 : parsed;
}