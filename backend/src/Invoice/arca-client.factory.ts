import { AfipSettings } from './afip-config';
import {
  ArcaClient,
  ArcaComprobante,
  ArcaCondicionIva,
  ArcaPuntoVenta,
  ArcaSolicitarResult,
  ArcaTipoIva,
} from './arca-client';
import { ArcaSimulator } from './arca-simulator';

const NOT_READY =
  'El cliente SOAP de ARCA todavía no está implementado. Con AFIP_SIMULATE=false el proceso arranca, y la emisión real entra en el paso 8.';

function notReady(): Promise<never> {
  return Promise.reject(new Error(NOT_READY));
}

export class ArcaClientNotReady extends ArcaClient {
  ultimoAutorizado(): Promise<number> {
    return notReady();
  }

  solicitar(): Promise<ArcaSolicitarResult> {
    return notReady();
  }

  consultar(): Promise<ArcaComprobante | null> {
    return notReady();
  }

  dummy(): Promise<{ ok: boolean }> {
    return notReady();
  }

  getTiposIva(): Promise<ArcaTipoIva[]> {
    return notReady();
  }

  getCondicionIvaReceptor(): Promise<ArcaCondicionIva[]> {
    return notReady();
  }

  getPtosVenta(): Promise<ArcaPuntoVenta[]> {
    return notReady();
  }
}

export function createArcaClient(settings: AfipSettings): ArcaClient {
  if (settings.simulate) {
    return new ArcaSimulator(settings.simulateResult);
  }
  return new ArcaClientNotReady();
}
