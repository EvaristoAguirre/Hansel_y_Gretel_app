import {
  escposQr,
  fiscalTicketCommands,
  fiscalTicketPlainText,
} from './fiscal-ticket-print';
import { FiscalTicketPayload } from './fiscal-ticket';

function payload(afipEnv: string): FiscalTicketPayload {
  return {
    afipEnv,
    razonSocial: 'Local',
    domicilio: 'Calle 1',
    cuit: '20123456789',
    condicionIva: 'Responsable Inscripto',
    iibb: '',
    inicioActividades: '2020-01-01',
    ptoVta: 6,
    cbteNro: 1,
    cbteFch: '2026-10-22',
    lines: [{ name: 'Café', quantity: 1, subtotal: 6000, alicQuota: 21 }],
    discountAmount: 0,
    impNeto: 4958.68,
    impTotal: 6000,
    iva: [{ quota: 21, importe: 1041.32 }],
    cae: '86431018278060',
    caeFchVto: '2026-11-01',
    qrUrl: 'https://www.afip.gob.ar/fe/qr/?p=abc',
  };
}

describe('ticket fiscal impreso', () => {
  it('en homologación avisa y no escribe la URL', () => {
    const text = fiscalTicketPlainText(payload('homologacion'));
    expect(text).toMatch(/^HANSEL Y GRETEL\n\nFACTURA B/);
    expect(text).toContain('COMPROBANTE DE HOMOLOGACIÓN - SIN VALIDEZ FISCAL');
    expect(text).toContain('$ 6.000,00');
    expect(text).toContain('$ 1.041,32');
    expect(text).toContain('22/10/2026');
    expect(text).not.toContain('IIBB');
    expect(text).not.toContain('https://');
    const product = text.split('\n').find((line) => line.startsWith('1 Café'));
    expect(product?.endsWith('$ 6.000,00')).toBe(true);
    expect(product?.length).toBe(48);
    expect(text).toMatch(/TOTAL: \$ 6\.000,00\n\nConsumidor final/);
  });

  it('la fecha lleva la hora separada por un guión', () => {
    const text = fiscalTicketPlainText({
      ...payload('homologacion'),
      cbteTime: '17:12',
    });
    expect(text).toContain('Fecha: 22/10/2026 - 17:12hs');
  });

  it('en producción no agrega la leyenda de prueba', () => {
    expect(fiscalTicketPlainText(payload('produccion'))).not.toContain(
      'SIN VALIDEZ FISCAL',
    );
  });

  it('el comando de la térmica lleva el QR como imagen', () => {
    const commands = fiscalTicketCommands(payload('homologacion'));
    const qr = escposQr(payload('homologacion').qrUrl);
    expect(commands.includes(qr.toString('latin1'))).toBe(true);
    expect(commands).toContain('HOMOLOGACION');
    expect(commands).not.toContain('https://www.afip.gob.ar');
    expect(commands).toContain('\x1D\x21\x11HANSEL Y GRETEL\n\x1D\x21\x00\n');
    expect(commands).toContain('\x1B\x61\x00');
    expect(commands).toContain('\x1B\x45\x01\x1D\x21\x10TOTAL:');
    expect(commands).toContain('\x1B\x45\x00\x1D\x21\x00');
    expect(
      qr.subarray(0, 4).equals(Buffer.from([0x1d, 0x76, 0x30, 0x00])),
    ).toBe(true);
  });
});
