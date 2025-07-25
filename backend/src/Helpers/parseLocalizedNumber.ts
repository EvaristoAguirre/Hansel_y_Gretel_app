export function parseLocalizedNumber(value: string | number): number {
  if (typeof value === 'number') return value;

  const hasThousands = /\.\d{3}/.test(value);
  const hasCommaDecimal = value.includes(',');

  let normalized = value;

  if (hasThousands && hasCommaDecimal) {
    normalized = value.replace(/\./g, '').replace(',', '.');
  } else if (hasCommaDecimal) {
    normalized = value.replace(',', '.');
  }

  const parsed = Number(normalized);

  if (isNaN(parsed)) {
    throw new Error(`Invalid numeric format: ${value}`);
  }

  return parsed;
}
