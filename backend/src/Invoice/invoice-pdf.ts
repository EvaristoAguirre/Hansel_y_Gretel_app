// pdfkit publica la clase con `export =` y este tsconfig no usa esModuleInterop.
// eslint-disable-next-line @typescript-eslint/no-require-imports
import PDFDocument = require('pdfkit');
import { toBuffer } from 'qrcode';
import { Invoice } from './invoice.entity';
import { fiscalTicketFromInvoice } from './fiscal-ticket';

export async function renderInvoicePdf(invoice: Invoice): Promise<Buffer> {
  const ticket = fiscalTicketFromInvoice(invoice);
  const qr = await toBuffer(ticket.qrUrl, {
    type: 'png',
    margin: 1,
    width: 180,
  });

  const doc = new PDFDocument({ size: 'A4', margin: 40, compress: false });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  if (ticket.afipEnv === 'simulado') {
    doc
      .fontSize(12)
      .text('COMPROBANTE SIMULADO - SIN VALIDEZ FISCAL', { align: 'center' });
    doc.moveDown();
  }

  doc.fontSize(18).text('FACTURA B', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(11);
  doc.text(ticket.razonSocial);
  doc.text(ticket.domicilio);
  doc.text(`CUIT: ${ticket.cuit}`);
  doc.text(ticket.condicionIva);
  doc.text(`IIBB: ${ticket.iibb}`);
  doc.text(`Inicio de actividades: ${ticket.inicioActividades}`);
  doc.moveDown();
  doc.text(
    `Punto de venta ${String(ticket.ptoVta).padStart(4, '0')}  Nro ${String(ticket.cbteNro).padStart(8, '0')}`,
  );
  doc.text(`Fecha: ${ticket.cbteFch}`);
  doc.moveDown();

  for (const line of ticket.lines) {
    doc.text(
      `${line.quantity}  ${line.name}  $${line.subtotal.toFixed(2)}  IVA ${line.alicQuota}%`,
    );
  }

  if (ticket.discountAmount > 0) {
    doc.text(`Descuento: $${ticket.discountAmount.toFixed(2)}`);
  }

  doc.moveDown();
  doc.text(`Total: $${ticket.impTotal.toFixed(2)}`);
  doc.text('Consumidor final');
  for (const item of ticket.iva) {
    doc.text(`IVA contenido ${item.quota}%: $${item.importe.toFixed(2)}`);
  }
  doc.moveDown();
  doc.text(`CAE: ${ticket.cae}`);
  doc.text(`Vencimiento CAE: ${ticket.caeFchVto}`);
  doc.moveDown();
  doc.image(qr, { width: 140 });
  doc.moveDown();
  doc.fontSize(8).text(ticket.qrUrl, { width: 500 });
  doc.end();
  return done;
}
