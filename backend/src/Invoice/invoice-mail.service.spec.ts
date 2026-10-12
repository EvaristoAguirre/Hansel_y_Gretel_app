import { BadGatewayException } from '@nestjs/common';
import { Invoice } from './invoice.entity';
import { InvoiceMailService } from './invoice-mail.service';

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
    let attachment: Buffer | undefined;

    const result = await service.send(row.id, async (mail) => {
      attachment = mail.pdf;
      expect(mail.to).toBe('cliente@example.com');
    });

    expect(result.sent).toBe(true);
    expect(result.cae).toBe('00000000000003');
    expect(attachment?.subarray(0, 5).toString()).toBe('%PDF-');
    expect(save).toHaveBeenCalled();
    expect(row.emailSentAt).toBeInstanceOf(Date);
  });
});
