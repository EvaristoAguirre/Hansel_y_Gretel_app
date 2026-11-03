import { Invoice } from './invoice.entity';
import { fiscalTicketFromInvoice } from './fiscal-ticket';
import {
  comprobanteNumero,
  fiscalLegend,
  formatFiscalDate,
  formatFiscalMoney,
} from './invoice-format';

export interface InvoiceMailContent {
  subject: string;
  text: string;
  html: string;
  filename: string;
}

export function invoiceMailContent(invoice: Invoice): InvoiceMailContent {
  const ticket = fiscalTicketFromInvoice(invoice);
  const number = comprobanteNumero(ticket.ptoVta, ticket.cbteNro);
  const legend = fiscalLegend(ticket.afipEnv);
  const fecha = formatFiscalDate(ticket.cbteFch);
  const total = formatFiscalMoney(ticket.impTotal);
  const vto = formatFiscalDate(ticket.caeFchVto);
  const filename = `factura-b-${number}.pdf`;

  const text = [
    ticket.razonSocial,
    `Factura B ${number}`,
    legend,
    `Fecha: ${fecha}`,
    `Total: ${total}`,
    `CAE: ${ticket.cae}`,
    `Vencimiento del CAE: ${vto}`,
    '',
    'Adjuntamos el comprobante.',
  ]
    .filter((line) => line !== null && line !== '')
    .join('\n');

  const legendHtml = legend
    ? `<p style="color:#8a5a00;font-weight:bold;">${escapeHtml(legend)}</p>`
    : '';

  const html = `<div style="font-family:Arial,sans-serif;color:#222;max-width:560px;">
<img src="cid:logo" alt="Hansel y Gretel" width="280" style="display:block;margin:0 auto 16px;" />
<p style="font-size:16px;margin:0 0 8px;">${escapeHtml(ticket.razonSocial)}</p>
<h1 style="font-size:20px;margin:0 0 12px;">Factura B ${escapeHtml(number)}</h1>
${legendHtml}
<p style="margin:4px 0;">Fecha: ${escapeHtml(fecha)}</p>
<p style="margin:4px 0;">Total: ${escapeHtml(total)}</p>
<p style="margin:4px 0;">CAE: ${escapeHtml(ticket.cae)}</p>
<p style="margin:4px 0;">Vencimiento del CAE: ${escapeHtml(vto)}</p>
<p style="margin:16px 0 0;">Adjuntamos el comprobante.</p>
</div>`;

  return {
    subject: `Factura B ${number}`,
    text,
    html,
    filename,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
