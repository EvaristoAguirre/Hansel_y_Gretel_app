import { FiscalTicketPayload } from './fiscal-ticket';
import {
  fiscalLegend,
  formatFiscalDate,
  formatFiscalMoney,
  formatQuota,
} from './invoice-format';

interface QrSymbol {
  modules: {
    size: number;
    get(row: number, col: number): number | boolean;
  };
}

// qrcode publica create en runtime; los tipos oficiales no lo declaran.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const qrcode = require('qrcode') as {
  create(text: string, options: { errorCorrectionLevel: 'M' }): QrSymbol;
};

export function fiscalTicketLines(payload: FiscalTicketPayload): string[] {
  const lines: string[] = ['FACTURA B'];
  const legend = fiscalLegend(payload.afipEnv);
  if (legend) lines.push(legend);
  lines.push(payload.razonSocial);
  if (payload.domicilio.trim()) lines.push(payload.domicilio);
  if (payload.cuit.trim()) lines.push(`CUIT: ${payload.cuit}`);
  if (payload.condicionIva.trim()) lines.push(payload.condicionIva);
  if (payload.iibb.trim()) lines.push(`IIBB: ${payload.iibb}`);
  if (payload.inicioActividades.trim()) {
    lines.push(
      `Inicio de actividades: ${formatFiscalDate(payload.inicioActividades)}`,
    );
  }
  lines.push(
    `Punto de venta ${String(payload.ptoVta).padStart(4, '0')}  Nro ${String(payload.cbteNro).padStart(8, '0')}`,
  );
  lines.push(`Fecha: ${formatFiscalDate(payload.cbteFch)}`);
  lines.push('-----------------------------------');
  for (const line of payload.lines) {
    lines.push(`${line.quantity} ${line.name}`);
    lines.push(
      `IVA ${formatQuota(line.alicQuota)}  ${formatFiscalMoney(line.subtotal)}`,
    );
  }
  if (payload.discountAmount > 0) {
    lines.push(`Descuento: ${formatFiscalMoney(payload.discountAmount)}`);
  }
  lines.push('-----------------------------------');
  if (payload.impNeto != null) {
    lines.push(`Neto: ${formatFiscalMoney(payload.impNeto)}`);
  }
  lines.push(`TOTAL: ${formatFiscalMoney(payload.impTotal)}`);
  lines.push('Consumidor final');
  for (const item of payload.iva) {
    lines.push(
      `IVA contenido ${formatQuota(item.quota)}: ${formatFiscalMoney(item.importe)}`,
    );
  }
  lines.push(`CAE: ${payload.cae}`);
  lines.push(`Vencimiento CAE: ${formatFiscalDate(payload.caeFchVto)}`);
  return lines;
}

export function fiscalTicketPlainText(payload: FiscalTicketPayload): string {
  return `${fiscalTicketLines(payload).join('\n')}\n`;
}

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Imagen ESC/POS (GS v 0). No incluye la URL como texto. */
export function escposQr(url: string): Buffer {
  const qr = qrcode.create(url, { errorCorrectionLevel: 'M' });
  const quiet = 4;
  const modules = qr.modules.size + quiet * 2;
  const scale = modules * 4 <= 360 ? 4 : 3;
  const size = modules * scale;
  const bytesPerRow = Math.ceil(size / 8);
  const raster = Buffer.alloc(bytesPerRow * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const col = Math.floor(x / scale) - quiet;
      const row = Math.floor(y / scale) - quiet;
      const inside =
        col >= 0 && row >= 0 && col < qr.modules.size && row < qr.modules.size;
      if (!inside || !qr.modules.get(row, col)) continue;
      raster[y * bytesPerRow + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  const header = Buffer.from([
    0x1d,
    0x76,
    0x30,
    0x00,
    bytesPerRow & 0xff,
    (bytesPerRow >> 8) & 0xff,
    size & 0xff,
    (size >> 8) & 0xff,
  ]);
  return Buffer.concat([header, raster]);
}

export function fiscalTicketCommands(payload: FiscalTicketPayload): string {
  const text = stripAccents(fiscalTicketLines(payload).join('\n'));
  const parts = [
    Buffer.from('\x1B\x40\x1B\x74\x02\x1B\x61\x01', 'latin1'),
    Buffer.from(`${text}\n`, 'latin1'),
    escposQr(payload.qrUrl),
    Buffer.from('\n\x1D\x56\x41\x50', 'latin1'),
  ];
  return Buffer.concat(parts).toString('latin1');
}
