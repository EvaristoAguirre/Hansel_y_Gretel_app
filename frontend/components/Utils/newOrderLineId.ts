/** Id único por línea del carrito (mismo producto o promo repetidos como ítems separados). */
export function newOrderLineId(): string {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
