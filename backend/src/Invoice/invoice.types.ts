import { InvoiceAfipEnv, InvoiceStatus } from './invoice.entity';

export interface InvoiceCloseView {
  id: string;
  status: InvoiceStatus;
  cbteNro: number | null;
  cae: string | null;
  afipEnv: InvoiceAfipEnv;
  message: string;
}

export interface InvoiceSnapshotLine {
  name: string;
  quantity: number;
  unitaryPrice: number;
  subtotal: number;
  alicQuota: number;
}

export interface InvoiceSnapshot {
  origin: 'order' | 'manual';
  tableName: string | null;
  lines: InvoiceSnapshotLine[];
  consumption: number;
  discountAmount: number;
  tipExcluded: number;
  emitter: {
    cuit: string | null;
    razonSocial: string | null;
    domicilio: string | null;
    condicionIva: string;
    iibb: string | null;
    inicioActividades: string | null;
  };
}
