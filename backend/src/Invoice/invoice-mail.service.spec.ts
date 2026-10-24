import { BadGatewayException } from '@nestjs/common';
import { Invoice } from './invoice.entity';
import { invoiceMailContent } from './invoice-mail-content';
import {
  InvoiceMailService,
  OutgoingInvoiceMail,
} from './invoice-mail.service';

function invoice(): Invoice {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    origin: 'manual',
    orderId: null,
    afipEnv: 'simulado',
    status: 'authorized',
    ptoVta: 1,
    cbteTipo: 6,
    cbteNro: 3,
    cbteFch: '2026-10-12',
    concepto: 1,
    docTipo: 99,
    docNro: 0,
    condicionIvaReceptorId: 0,
    impTotal: '121.00',
    impTotConc: '0.00',
    impNeto: '100.00',
    impOpEx: '0.00',
    impTrib: '0.00',
    impIva: '21.00',
    iva: [{ id: 5, quota: 21, baseImp: 100, importe: 21 }],
    discountAmount: '0.00',
    tipExcluded: '0.00',
    cae: '00000000000003',
    caeFchVto: '2026-10-22',
    resultado: 'A',
    arcaErrors: null,
    customerEmail: 'cliente@example.com',
    emailSentAt: null,
    snapshot: {
      origin: 'manual',
      tableName: null,
      lines: [
        {
          name: 'Café',
          quantity: 1,
          unitaryPrice: 121,
          subtotal: 121,
          alicQuota: 21,
        },
      ],
      consumption: 121,
      discountAmount: 0,
      tipExcluded: 0,
      emitter: {
        cuit: null,
        razonSocial: 'Hansel y Gretel',
        domicilio: null,
        condicionIva: 'Responsable Inscripto',
        iibb: null,
        inicioActividades: null,
      },
    },
    attemptCount: 1,
    lastAttemptAt: null,
    authorizedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Invoice;
}

describe('InvoiceMailService', () => {
  it('un SMTP que falla deja la factura autorizada y el email intacto', async () => {
    const row = invoice();
    const save = jest.fn();
    const service = new InvoiceMailService(
      { detail: jest.fn(async () => row) } as any,
      { save } as any,
    );

    await expect(
      service.send(row.id, async () => {
        throw new Error('smtp caído');
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);

    expect(save).not.toHaveBeenCalled();
    expect(row.status).toBe('authorized');
    expect(row.cae).toBe('00000000000003');
    expect(row.customerEmail).toBe('cliente@example.com');
  });

  it('si el envío sale, adjunta el PDF y marca la fecha', async () => {
    const row = invoice();
    const save = jest.fn(async (saved) => saved);
    const service = new InvoiceMailService(
      { detail: jest.fn(async () => row) } as any,
      { save } as any,
    );
    let sent: OutgoingInvoiceMail | undefined;

    const result = await service.send(row.id, async (mail) => {
      sent = mail;
    });

    expect(result.sent).toBe(true);
    expect(result.cae).toBe('00000000000003');
    expect(sent?.to).toBe('cliente@example.com');
    expect(sent?.subject).toBe('Factura B 0001-00000003');
    expect(sent?.text).toContain('CAE: 00000000000003');
    expect(sent?.text).toContain('$ 121,00');
    expect(sent?.text).toContain('SIN VALIDEZ FISCAL');
    expect(sent?.html).toContain('cid:logo');
    expect(sent?.html).not.toContain('https://www.afip.gob.ar');
    expect(sent?.filename).toBe('factura-b-0001-00000003.pdf');
    expect(sent?.logo.subarray(0, 4).toString('latin1')).toBe('\x89PNG');
    expect(sent?.pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(save).toHaveBeenCalled();
    expect(row.emailSentAt).toBeInstanceOf(Date);
  });

  it('en producción el correo no lleva la leyenda de prueba', () => {
    const row = invoice();
    row.afipEnv = 'produccion';
    const content = invoiceMailContent(row);
    expect(content.text).not.toContain('SIN VALIDEZ FISCAL');
    expect(content.html).not.toContain('SIN VALIDEZ FISCAL');
    expect(content.html).toContain('cid:logo');
  });
});
