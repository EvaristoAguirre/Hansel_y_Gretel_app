/**
 * Mapa inicial porcentaje → id de WSFEv1.
 * El paso 8 lo contrasta con FEParamGetTiposIva. No copiar estos ids al entorno
 * como si ya estuvieran confirmados en homologación.
 */
export const AFIP_ALICUOTAS = [
  { id: 3, quota: 0 },
  { id: 9, quota: 2.5 },
  { id: 8, quota: 5 },
  { id: 4, quota: 10.5 },
  { id: 5, quota: 21 },
  { id: 6, quota: 27 },
] as const;

export function alicuotaId(quota: number): number {
  const found = AFIP_ALICUOTAS.find(
    (item) => Math.abs(item.quota - quota) < 0.001,
  );
  if (!found) {
    throw new Error(
      `No hay id de ARCA para la alícuota ${quota}. Hay que confirmarla en homologación.`,
    );
  }
  return found.id;
}
