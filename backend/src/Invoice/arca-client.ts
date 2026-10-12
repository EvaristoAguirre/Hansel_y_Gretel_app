export interface ArcaIvaItem {
  id: number;
  baseImp: number;
  importe: number;
}

export interface ArcaSolicitud {
  ptoVta: number;
  cbteTipo: number;
  cbteNro: number;
  cbteFch: string;
  concepto: number;
  docTipo: number;
  docNro: number;
  condicionIvaReceptorId: number;
  impTotal: number;
  impTotConc: number;
  impNeto: number;
  impOpEx: number;
  impTrib: number;
  impIva: number;
  iva: ArcaIvaItem[];
}

export interface ArcaObservacion {
  code: string;
  msg: string;
}

export type ArcaSolicitarResult =
  | {
      outcome: 'authorized';
      cae: string;
      caeFchVto: string;
      reproceso: boolean;
    }
  | { outcome: 'rejected'; errors: ArcaObservacion[] }
  | { outcome: 'timeout' };

export interface ArcaComprobante {
  ptoVta: number;
  cbteTipo: number;
  cbteNro: number;
  cae: string;
  caeFchVto: string;
  impTotal: number;
}

export interface ArcaTipoIva {
  id: number;
  desc: string;
  quota: number;
}

export interface ArcaCondicionIva {
  id: number;
  desc: string;
}

export interface ArcaPuntoVenta {
  nro: number;
}

export abstract class ArcaClient {
  abstract ultimoAutorizado(ptoVta: number, cbteTipo: number): Promise<number>;
  abstract solicitar(solicitud: ArcaSolicitud): Promise<ArcaSolicitarResult>;
  abstract consultar(
    ptoVta: number,
    cbteTipo: number,
    cbteNro: number,
  ): Promise<ArcaComprobante | null>;
  abstract dummy(): Promise<{ ok: boolean }>;
  abstract getTiposIva(): Promise<ArcaTipoIva[]>;
  abstract getCondicionIvaReceptor(): Promise<ArcaCondicionIva[]>;
  abstract getPtosVenta(): Promise<ArcaPuntoVenta[]>;
}
