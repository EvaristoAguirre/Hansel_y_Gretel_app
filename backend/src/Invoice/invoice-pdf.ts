// pdfkit publica la clase con `export =` y este tsconfig no usa esModuleInterop.
// eslint-disable-next-line @typescript-eslint/no-require-imports
import PDFDocument = require('pdfkit');
import { toBuffer } from 'qrcode';
import { Invoice } from './invoice.entity';
import { FiscalTicketPayload, fiscalTicketFromInvoice } from './fiscal-ticket';
import {
  fiscalLegend,
  formatFiscalDate,
  formatFiscalMoney,
  formatQuota,
} from './invoice-format';
import { invoiceLogoPath } from './invoice-logo';

const MARGIN = 48;
const LOGO_WIDTH = 200;
const LOGO_RATIO = 411 / 720;

export async function renderInvoicePdf(invoice: Invoice): Promise<Buffer> {
  const ticket = fiscalTicketFromInvoice(invoice);
  const qr = await toBuffer(ticket.qrUrl, {
    type: 'png',
    margin: 1,
    width: 180,
  });
  return drawInvoicePdf(ticket, qr);
}

function drawInvoicePdf(
  ticket: FiscalTicketPayload,
  qr: Buffer,
): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: MARGIN, compress: false });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const logoWidth = LOGO_WIDTH;
  const logoX = (doc.page.width - logoWidth) / 2;
  const logoY = doc.y;
  doc.image(invoiceLogoPath(), logoX, logoY, { width: logoWidth });
  doc.y = logoY + logoWidth * LOGO_RATIO + 16;

  const legend = fiscalLegend(ticket.afipEnv);
  if (legend) {
    doc.fontSize(11).text(legend, { align: 'center' });
    doc.moveDown(0.6);
  }

  doc.fontSize(18).text('FACTURA B', { align: 'center' });
  doc.fontSize(10).text('Código 06', { align: 'center' });
  doc.moveDown();

  doc.fontSize(11);
  writeLine(doc, ticket.razonSocial);
  if (ticket.domicilio.trim()) writeLine(doc, ticket.domicilio);
  if (ticket.cuit.trim()) writeLine(doc, `CUIT: ${ticket.cuit}`);
  if (ticket.condicionIva.trim()) writeLine(doc, ticket.condicionIva);
  if (ticket.iibb.trim()) writeLine(doc, `IIBB: ${ticket.iibb}`);
  if (ticket.inicioActividades.trim()) {
    writeLine(
      doc,
      `Inicio de actividades: ${formatFiscalDate(ticket.inicioActividades)}`,
    );
  }

  rule(doc);
  writeLine(
    doc,
    `Punto de venta ${String(ticket.ptoVta).padStart(4, '0')}  Nro ${String(ticket.cbteNro).padStart(8, '0')}`,
  );
  writeLine(doc, `Fecha: ${formatFiscalDate(ticket.cbteFch)}`);
  rule(doc);

  for (const line of ticket.lines) {
    pair(
      doc,
      `${line.quantity}  ${line.name}`,
      `${formatQuota(line.alicQuota)}   ${formatFiscalMoney(line.subtotal)}`,
    );
  }

  if (ticket.discountAmount > 0) {
    pair(doc, 'Descuento', formatFiscalMoney(ticket.discountAmount));
  }

  rule(doc);
  if (ticket.impNeto != null) {
    pair(doc, 'Neto', formatFiscalMoney(ticket.impNeto));
  }
  doc.fontSize(13);
  pair(doc, 'Total', formatFiscalMoney(ticket.impTotal));
  doc.fontSize(11);
  writeLine(doc, 'Consumidor final');
  for (const item of ticket.iva) {
    pair(
      doc,
      `IVA contenido ${formatQuota(item.quota)}`,
      formatFiscalMoney(item.importe),
    );
  }

  rule(doc);
  writeLine(doc, `CAE: ${ticket.cae}`);
  writeLine(doc, `Vencimiento CAE: ${formatFiscalDate(ticket.caeFchVto)}`);
  doc.moveDown();

  const qrSize = 140;
  const qrX = (doc.page.width - qrSize) / 2;
  const qrY = doc.y;
  doc.image(qr, qrX, qrY, { width: qrSize });
  doc.y = qrY + qrSize;
  doc.end();
  return done;
}

function writeLine(doc: PDFKit.PDFDocument, text: string) {
  doc.text(text, MARGIN, doc.y, { width: doc.page.width - MARGIN * 2 });
}

function pair(doc: PDFKit.PDFDocument, left: string, right: string) {
  const y = doc.y;
  const width = doc.page.width - MARGIN * 2;
  const rightWidth = 180;
  doc.text(left, MARGIN, y, { width: width - rightWidth });
  const afterLeft = doc.y;
  doc.text(right, MARGIN + width - rightWidth, y, {
    width: rightWidth,
    align: 'right',
  });
  doc.y = Math.max(doc.y, afterLeft);
}

function rule(doc: PDFKit.PDFDocument) {
  doc.moveDown(0.4);
  const y = doc.y;
  doc
    .moveTo(MARGIN, y)
    .lineTo(doc.page.width - MARGIN, y)
    .stroke();
  doc.moveDown(0.4);
}
