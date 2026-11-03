import { ConflictException, Injectable } from '@nestjs/common';
import { PrinterService } from 'src/Printer/printer.service';
import { fiscalTicketFromInvoice } from './fiscal-ticket';
import { Invoice } from './invoice.entity';
import { renderInvoicePdf } from './invoice-pdf';
import { InvoiceService } from './invoice.service';

@Injectable()
export class InvoiceDocumentService {
  constructor(
    private readonly invoices: InvoiceService,
    private readonly printer: PrinterService,
  ) {}

  async pdf(id: string): Promise<Buffer> {
    const invoice = await this.requireAuthorized(id);
    return renderInvoicePdf(invoice);
  }

  async print(id: string): Promise<{ printed: true }> {
    const invoice = await this.requireAuthorized(id);
    await this.printer.printFiscalTicket(fiscalTicketFromInvoice(invoice));
    return { printed: true };
  }

  private async requireAuthorized(id: string): Promise<Invoice> {
    const invoice = await this.invoices.detail(id);
    if (invoice.status !== 'authorized' || !invoice.cae) {
      throw new ConflictException(
        'El PDF y la reimpresión están disponibles cuando la factura está autorizada.',
      );
    }
    return invoice;
  }
}
