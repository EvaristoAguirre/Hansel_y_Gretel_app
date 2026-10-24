import { Invoice } from './invoice.entity';
import { fiscalQrUrl } from './invoice-qr';
import { InvoiceSnapshot } from './invoice.types';

export interface FiscalTicketPayload {
  afipEnv: string;
  razonSocial: string;
  domicilio: string;
  cuit: string;
  condicionIva: string;
  iibb: string;
  inicioActividades: string;
  ptoVta: number;
  cbteNro: number;
  cbteFch: string;
  lines: {
    name: string;
    quantity: number;
    subtotal: number;
    alicQuota: number;
  }[];
  discountAmount: number;
  impNeto?: number;
  impTotal: number;
  iva: { quota: number; importe: number }[];
  cae: string;
  caeFchVto: string;
  qrUrl: string;
}

export function fiscalTicketFromInvoice(invoice: Invoice): FiscalTicketPayload {
  const snapshot = invoice.snapshot as unknown as InvoiceSnapshot;
  const emitter = snapshot.emitter ?? {
    cuit: null,
    razonSocial: null,
    domicilio: null,
    condicionIva: 'Responsable Inscripto',
    iibb: null,
    inicioActividades: null,
  };
  const cuitDigits = (emitter.cuit ?? '').replace(/\D/g, '');
  return {
    afipEnv: invoice.afipEnv,
    razonSocial: emitter.razonSocial ?? '',
    domicilio: emitter.domicilio ?? '',
    cuit: emitter.cuit ?? '',
    condicionIva: emitter.condicionIva,
    iibb: emitter.iibb ?? '',
    inicioActividades: emitter.inicioActividades ?? '',
    ptoVta: invoice.ptoVta,
    cbteNro: invoice.cbteNro ?? 0,
    cbteFch: String(invoice.cbteFch),
    lines: snapshot.lines ?? [],
    discountAmount: Number(invoice.discountAmount ?? 0),
    impNeto: Number(invoice.impNeto),
    impTotal: Number(invoice.impTotal),
    iva: (invoice.iva ?? []).map((item) => ({
      quota: item.quota,
      importe: item.importe,
    })),
    cae: invoice.cae ?? '',
    caeFchVto: invoice.caeFchVto ? String(invoice.caeFchVto) : '',
    qrUrl: fiscalQrUrl({
      fecha: String(invoice.cbteFch).slice(0, 10),
      cuit: Number(cuitDigits || 0),
      ptoVta: invoice.ptoVta,
      nroCmp: invoice.cbteNro ?? 0,
      importe: Number(invoice.impTotal),
      codAut: invoice.cae ?? '0',
    }),
  };
}
