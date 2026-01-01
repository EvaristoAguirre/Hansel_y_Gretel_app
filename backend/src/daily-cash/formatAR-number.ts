export const formatARNumber = (
  value: number | string | null | undefined,
): string => {
  if (value === null || value === undefined) {
    return '0';
  }
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return '0';
  }
  return new Intl.NumberFormat('es-AR', {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(numValue);
};
