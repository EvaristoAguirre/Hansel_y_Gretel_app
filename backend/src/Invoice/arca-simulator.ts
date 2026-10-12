import { AfipSimulateResult } from './afip-config';
import {
  ArcaClient,
  ArcaComprobante,
  ArcaSolicitarResult,
  ArcaSolicitud,
} from './arca-client';

const REJECTED_MSG =
  'Rechazado por simulación (AFIP_SIMULATE_RESULT=rejected).';

/**
 * Catálogo de desarrollo. El paso 8 lo contrasta con FEParamGetTiposIva
 * antes de apagar la simulación. No es la tabla fiscal definitiva.
 */
const SIMULATED_TIPOS_IVA = [
  { id: 3, desc: '0%', quota: 0 },
  { id: 9, desc: '2.5%', quota: 2.5 },
  { id: 8, desc: '5%', quota: 5 },
  { id: 4, desc: '10.5%', quota: 10.5 },
  { id: 5, desc: '21%', quota: 21 },
  { id: 6, desc: '27%', quota: 27 },
];

export class ArcaSimulator extends ArcaClient {
  private readonly authorized = new Map<string, ArcaComprobante>();

  constructor(private readonly result: AfipSimulateResult) {
    super();
  }

  async ultimoAutorizado(ptoVta: number, cbteTipo: number): Promise<number> {
    let max = 0;
    for (const comprobante of this.authorized.values()) {
      if (comprobante.ptoVta === ptoVta && comprobante.cbteTipo === cbteTipo) {
        max = Math.max(max, comprobante.cbteNro);
      }
    }
    return max;
  }

  async solicitar(solicitud: ArcaSolicitud): Promise<ArcaSolicitarResult> {
    const key = sequenceKey(
      solicitud.ptoVta,
      solicitud.cbteTipo,
      solicitud.cbteNro,
    );
    const existing = this.authorized.get(key);

    if (this.result === 'rejected') {
      return {
        outcome: 'rejected',
        errors: [{ code: 'SIM-R', msg: REJECTED_MSG }],
      };
    }

    if (this.result === 'timeout') {
      return { outcome: 'timeout' };
    }

    if (existing) {
      return {
        outcome: 'authorized',
        cae: existing.cae,
        caeFchVto: existing.caeFchVto,
        reproceso: true,
      };
    }

    const comprobante: ArcaComprobante = {
      ptoVta: solicitud.ptoVta,
      cbteTipo: solicitud.cbteTipo,
      cbteNro: solicitud.cbteNro,
      cae: fakeCae(solicitud.cbteNro),
      caeFchVto: addDays(solicitud.cbteFch, 10),
      impTotal: solicitud.impTotal,
    };
    this.authorized.set(key, comprobante);

    return {
      outcome: 'authorized',
      cae: comprobante.cae,
      caeFchVto: comprobante.caeFchVto,
      reproceso: false,
    };
  }

  async consultar(
    ptoVta: number,
    cbteTipo: number,
    cbteNro: number,
  ): Promise<ArcaComprobante | null> {
    return this.authorized.get(sequenceKey(ptoVta, cbteTipo, cbteNro)) ?? null;
  }

  async dummy(): Promise<{ ok: boolean }> {
    return { ok: true };
  }

  async getTiposIva() {
    return SIMULATED_TIPOS_IVA.map((item) => ({ ...item }));
  }

  async getCondicionIvaReceptor() {
    return [
      {
        id: 0,
        desc: 'Consumidor Final (simulado; el id real se confirma en homologación)',
      },
    ];
  }

  async getPtosVenta() {
    return [{ nro: 1 }];
  }
}

function sequenceKey(
  ptoVta: number,
  cbteTipo: number,
  cbteNro: number,
): string {
  return `${ptoVta}:${cbteTipo}:${cbteNro}`;
}

function fakeCae(cbteNro: number): string {
  return String(cbteNro).padStart(14, '0');
}

function addDays(yyyymmdd: string, days: number): string {
  if (!/^\d{8}$/.test(yyyymmdd)) {
    throw new Error('cbteFch debe tener formato AAAAMMDD.');
  }
  const year = Number(yyyymmdd.slice(0, 4));
  const month = Number(yyyymmdd.slice(4, 6));
  const day = Number(yyyymmdd.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}
