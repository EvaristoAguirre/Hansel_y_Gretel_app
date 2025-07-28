export function parseLocalizedNumber(value: string | number): number {
  if (typeof value === 'number') return value;

  const hasThousands = /\.\d{3}/.test(value);
  const hasCommaDecimal = value.includes(',');

  let normalized = value;

  if (hasThousands && hasCommaDecimal) {
    // Ej: "1.234,56" → "1234.56"
    normalized = value.replace(/\./g, '').replace(',', '.');
  } else if (hasCommaDecimal) {
    // Ej: "123,45" → "123.45"
    normalized = value.replace(',', '.');
  } else if (hasThousands) {
    // Ej: "5.000" → "5000"
    normalized = value.replace(/\./g, '');
  }

  const parsed = Number(normalized);

  if (isNaN(parsed)) {
    throw new Error(`Invalid numeric format: ${value}`);
  }

  return parsed;
}
