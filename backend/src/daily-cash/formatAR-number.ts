export const formatARNumber = (value: number | string): string => {
  return new Intl.NumberFormat('es-AR', {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(Number(value));
};
