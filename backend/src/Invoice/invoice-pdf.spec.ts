import { ConflictException } from '@nestjs/common';
import { Invoice } from './invoice.entity';
import { InvoiceDocumentService } from './invoice-document.service';
import { fiscalQrUrl } from './invoice-qr';
import { renderInvoicePdf } from './invoice-pdf';

function sample(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    origin: 'order',
    orderId: null,
    afipEnv: 'simulado',
    status: 'authorized',
    ptoVta: 1,
    cbteTipo: 6,
    cbteNro: 7,
    cbteFch: '2026-10-12',
    concepto: 1,
    docTipo: 99,
    docNro: 0,
    condicionIvaReceptorId: 0,
    impTotal: '1210.00',
    impTotConc: '0.00',
    impNeto: '1000.00',
    impOpEx: '0.00',
    impTrib: '0.00',
    impIva: '210.00',
    iva: [{ id: 5, quota: 21, baseImp: 1000, importe: 210 }],
    discountAmount: '0.00',
    tipExcluded: '0.00',
    cae: '00000000000007',
    caeFchVto: '2026-10-22',
    resultado: 'A',
    arcaErrors: null,
    customerEmail: null,
    emailSentAt: null,
    snapshot: {
      lines: [{ name: 'Café', quantity: 1, subtotal: 1210, alicQuota: 21 }],
      emitter: {
        cuit: '20123456789',
        razonSocial: 'Hansel y Gretel',
        domicilio: 'Local',
        condicionIva: 'Responsable Inscripto',
        iibb: 'exento',
        inicioActividades: '2020-01-01',
      },
    },
    attemptCount: 1,
    lastAttemptAt: null,
    authorizedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Invoice;
}

function pdfText(buffer: Buffer): string {
  const raw = buffer.toString('latin1');
  const parts: string[] = [];
  for (const match of raw.matchAll(/<([0-9A-Fa-f]+)>/g)) {
    const hex = match[1];
    if (hex.length % 2 === 0)
      parts.push(Buffer.from(hex, 'hex').toString('latin1'));
  }
  return parts.join('');
}

describe('PDF y reimpresión', () => {
  it('el PDF incluye la leyenda, el CAE y el logo, sin la URL del QR', async () => {
    const buffer = await renderInvoicePdf(sample());
    const text = pdfText(buffer);
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(text).toContain('FACTURA B');
    expect(text).toContain('SIN VALIDEZ FISCAL');
    expect(text).toContain('00000000000007');
    expect(text).toContain('$ 1.210,00');
    expect(text).toContain('12/10/2026');
    expect(text).not.toContain('https://www.afip.gob.ar');
    const images =
      buffer.toString('latin1').match(/\/Subtype\s*\/Image/g) ?? [];
    expect(images.length).toBeGreaterThanOrEqual(2);
  });

  it('en homologación avisa que no tiene validez fiscal', async () => {
    const text = pdfText(
      await renderInvoicePdf(sample({ afipEnv: 'homologacion' })),
    );
    expect(text).toContain('COMPROBANTE DE HOMOLOGACIÓN - SIN VALIDEZ FISCAL');
    expect(text).not.toContain('https://www.afip.gob.ar');
  });

  it('en producción no agrega la leyenda de prueba', async () => {
    const text = pdfText(
      await renderInvoicePdf(sample({ afipEnv: 'produccion' })),
    );
    expect(text).not.toContain('SIN VALIDEZ FISCAL');
    expect(text).toContain('FACTURA B');
  });

  it('el QR de la RG 4892 lleva tipo 6 y documento 99', () => {
    const url = fiscalQrUrl({
      fecha: '2026-10-12',
      cuit: 20123456789,
      ptoVta: 1,
      nroCmp: 7,
      importe: 1210,
      codAut: '00000000000007',
    });
    const encoded = url.split('?p=')[1];
    const payload = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    expect(payload.ver).toBe(1);
    expect(payload.tipoCmp).toBe(6);
    expect(payload.tipoDocRec).toBe(99);
    expect(payload.nroDocRec).toBe(0);
    expect(payload.tipoCodAut).toBe('E');
  });

  it('la reimpresión usa la impresora y no el cliente de ARCA', async () => {
    const printer = { printFiscalTicket: jest.fn(async () => 'texto') };
    const invoices = { detail: jest.fn(async () => sample()) };
    const service = new InvoiceDocumentService(invoices as any, printer as any);
    await service.print(sample().id);
    expect(printer.printFiscalTicket).toHaveBeenCalledWith(
      expect.objectContaining({
        cae: '00000000000007',
        qrUrl: expect.stringContaining('https://www.afip.gob.ar/fe/qr/?p='),
      }),
    );
  });

  it('una pendiente no se imprime ni genera PDF', async () => {
    const printer = { printFiscalTicket: jest.fn() };
    const invoices = {
      detail: jest.fn(async () => sample({ status: 'pending', cae: null })),
    };
    const service = new InvoiceDocumentService(invoices as any, printer as any);
    await expect(service.pdf(sample().id)).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(service.print(sample().id)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(printer.printFiscalTicket).not.toHaveBeenCalled();
  });
});
