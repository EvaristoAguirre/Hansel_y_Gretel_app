import { FiscalTicketPayload } from './fiscal-ticket';
import {
  fiscalLegend,
  formatFiscalDate,
  formatFiscalMoney,
  formatQuota,
} from './invoice-format';

/** Caracteres por renglón de la térmica de 80 mm. */
const LINE_WIDTH = 48;
const SEPARATOR = '-'.repeat(LINE_WIDTH);
const ALIGN_LEFT = '\x1B\x61\x00';
const ALIGN_CENTER = '\x1B\x61\x01';
const BOLD_ON = '\x1B\x45\x01';
const BOLD_OFF = '\x1B\x45\x00';
const SIZE_NORMAL = '\x1D\x21\x00';
/** Doble altura: el paso de tamaño que tiene la térmica, sin ensanchar. */
const SIZE_TALL = '\x1D\x21\x10';

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

function fechaLine(payload: FiscalTicketPayload): string {
  const date = formatFiscalDate(payload.cbteFch);
  return payload.cbteTime
    ? `Fecha: ${date} - ${payload.cbteTime}hs`
    : `Fecha: ${date}`;
}

/** Producto a la izquierda y precio al borde derecho del papel. */
function padPair(left: string, right: string): string {
  const gap = LINE_WIDTH - left.length - right.length;
  if (gap >= 1) return left + ' '.repeat(gap) + right;
  const room = Math.max(0, LINE_WIDTH - right.length - 1);
  return `${left.slice(0, room)} ${right}`;
}

function headerLines(payload: FiscalTicketPayload): string[] {
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
  lines.push(fechaLine(payload));
  lines.push(SEPARATOR);
  return lines;
}

function itemLines(payload: FiscalTicketPayload): string[] {
  const lines: string[] = [];
  for (const line of payload.lines) {
    lines.push(
      padPair(
        `${line.quantity} ${line.name}`,
        formatFiscalMoney(line.subtotal),
      ),
    );
    lines.push(`IVA ${formatQuota(line.alicQuota)}`);
  }
  if (payload.discountAmount > 0) {
    lines.push(padPair('Descuento', formatFiscalMoney(payload.discountAmount)));
  }
  return lines;
}

function footerLines(payload: FiscalTicketPayload): string[] {
  const lines = ['Consumidor final'];
  for (const item of payload.iva) {
    lines.push(
      `IVA contenido ${formatQuota(item.quota)}: ${formatFiscalMoney(item.importe)}`,
    );
  }
  lines.push(`CAE: ${payload.cae}`);
  lines.push(`Vencimiento CAE: ${formatFiscalDate(payload.caeFchVto)}`);
  return lines;
}

export function fiscalTicketLines(payload: FiscalTicketPayload): string[] {
  const lines = [...headerLines(payload), ...itemLines(payload), SEPARATOR];
  if (payload.impNeto != null) {
    lines.push(`Neto: ${formatFiscalMoney(payload.impNeto)}`);
  }
  lines.push(`TOTAL: ${formatFiscalMoney(payload.impTotal)}`);
  lines.push('');
  lines.push(...footerLines(payload));
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
  const chunks: Buffer[] = [
    Buffer.from(`\x1B\x40\x1B\x74\x02${ALIGN_CENTER}`, 'latin1'),
  ];
  const write = (value: string) =>
    chunks.push(Buffer.from(stripAccents(value), 'latin1'));

  for (const line of headerLines(payload)) write(`${line}\n`);
  chunks.push(Buffer.from(ALIGN_LEFT, 'latin1'));
  for (const line of itemLines(payload)) write(`${line}\n`);
  chunks.push(Buffer.from(ALIGN_CENTER, 'latin1'));
  write(`${SEPARATOR}\n`);
  if (payload.impNeto != null) {
    write(`Neto: ${formatFiscalMoney(payload.impNeto)}\n`);
  }
  chunks.push(Buffer.from(`${BOLD_ON}${SIZE_TALL}`, 'latin1'));
  write(`TOTAL: ${formatFiscalMoney(payload.impTotal)}\n`);
  chunks.push(Buffer.from(`${BOLD_OFF}${SIZE_NORMAL}`, 'latin1'));
  write('\n');
  for (const line of footerLines(payload)) write(`${line}\n`);
  write('\n');
  chunks.push(escposQr(payload.qrUrl));
  chunks.push(Buffer.from('\n\x1D\x56\x41\x50', 'latin1'));
  return Buffer.concat(chunks).toString('latin1');
}
