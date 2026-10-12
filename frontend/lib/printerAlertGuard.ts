const shownOrderIds = new Set<string>();

export function markPrinterAlertShown(orderId?: string | null) {
  if (!orderId) return;
  shownOrderIds.add(orderId);
  setTimeout(() => shownOrderIds.delete(orderId), 8000);
}

export function wasPrinterAlertShown(orderId?: string | null) {
  return !!orderId && shownOrderIds.has(orderId);
}
