import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createTransport } from 'nodemailer';
import { Repository } from 'typeorm';
import { Invoice } from './invoice.entity';
import { invoiceMailContent } from './invoice-mail-content';
import { invoiceLogoPng } from './invoice-logo';
import { renderInvoicePdf } from './invoice-pdf';
import { InvoiceService } from './invoice.service';

export interface OutgoingInvoiceMail {
  to: string;
  subject: string;
  text: string;
  html: string;
  pdf: Buffer;
  filename: string;
  logo: Buffer;
}

export type MailDelivery = (input: OutgoingInvoiceMail) => Promise<void>;

@Injectable()
export class InvoiceMailService {
  constructor(
    private readonly invoices: InvoiceService,
    @InjectRepository(Invoice)
    private readonly repo: Repository<Invoice>,
  ) {}

  async updateEmail(id: string, customerEmail: string) {
    const invoice = await this.invoices.detail(id);
    invoice.customerEmail = customerEmail.trim();
    const saved = await this.repo.save(invoice);
    return {
      id: saved.id,
      customerEmail: saved.customerEmail,
      cae: saved.cae,
      status: saved.status,
    };
  }

  async send(id: string, deliver: MailDelivery = deliverWithSmtp) {
    const invoice = await this.invoices.detail(id);
    if (invoice.status !== 'authorized' || !invoice.cae) {
      throw new ConflictException('Solo se envía una factura autorizada.');
    }
    if (!invoice.customerEmail) {
      throw new BadRequestException('Falta el email.');
    }

    const pdf = await renderInvoicePdf(invoice);
    const content = invoiceMailContent(invoice);
    const logo = invoiceLogoPng();
    const cae = invoice.cae;
    const email = invoice.customerEmail;
    try {
      await deliver({
        to: email,
        subject: content.subject,
        text: content.text,
        html: content.html,
        pdf,
        filename: content.filename,
        logo,
      });
    } catch {
      throw new BadGatewayException(
        'No se pudo enviar el correo. La factura sigue autorizada y el email no cambió.',
      );
    }

    invoice.emailSentAt = new Date();
    await this.repo.save(invoice);
    return { sent: true, customerEmail: email, cae };
  }
}

async function deliverWithSmtp(input: OutgoingInvoiceMail): Promise<void> {
  const host = process.env.SMTP_HOST;
  if (!host) {
    throw new Error('SMTP sin configurar');
  }
  const transport = createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    attachments: [
      {
        filename: input.filename,
        content: input.pdf,
        contentType: 'application/pdf',
      },
      {
        filename: 'logo.png',
        content: input.logo,
        cid: 'logo',
        contentType: 'image/png',
      },
    ],
  });
}
