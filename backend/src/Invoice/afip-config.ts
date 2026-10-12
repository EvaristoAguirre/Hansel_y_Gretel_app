import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import {
  AFIP_ENVIRONMENTS,
  AFIP_URLS,
  AfipEndpointUrls,
  AfipEnvironment,
} from './afip-urls';

export const AFIP_SIMULATE_RESULTS = [
  'authorized',
  'rejected',
  'timeout',
] as const;

export type AfipSimulateResult = (typeof AFIP_SIMULATE_RESULTS)[number];

export type AfipRuntimeMode = 'simulado' | AfipEnvironment;

export interface AfipSettings {
  simulate: boolean;
  simulateResult: AfipSimulateResult;
  /** Ambiente declarado. En simulación puede ser null. Nunca se usa para abrir sockets si simulate es true. */
  environment: AfipEnvironment | null;
  /** Línea de arranque: simulado, homologacion o produccion. */
  mode: AfipRuntimeMode;
  urls: AfipEndpointUrls | null;
  cuit: string | null;
  ptoVta: number | null;
  certPath: string | null;
  keyPath: string | null;
  alicuotaDefaultPct: number;
  condicionIvaReceptorId: number | null;
  concepto: number;
  razonSocial: string | null;
  domicilio: string | null;
  iibb: string | null;
  inicioActividades: string | null;
  timeoutMs: number;
}

export class AfipConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AfipConfigError';
  }
}

/**
 * Si AFIP_SIMULATE no está definida, se toma true.
 * El proceso que hoy no tiene estas variables sigue levantando y no llama a ARCA.
 */
const SIMULATE_WHEN_UNSET = true;

export function resolveAfipConfig(
  env: NodeJS.ProcessEnv,
  fileExists: (path: string) => boolean = fs.existsSync,
): AfipSettings {
  const simulate = readSimulate(env.AFIP_SIMULATE);
  const environment = readEnvironment(env.AFIP_ENV);
  const alicuotaDefaultPct = readAlicuota(env.AFIP_ALICUOTA_DEFAULT_PCT);
  const concepto = readConcepto(env.AFIP_CONCEPTO);
  const timeoutMs = readTimeout(env.AFIP_TIMEOUT_MS);
  const condicionIvaReceptorId = readOptionalPositiveInt(
    env.AFIP_CONDICION_IVA_RECEPTOR_ID,
    'AFIP_CONDICION_IVA_RECEPTOR_ID',
  );

  if (simulate && environment === 'produccion') {
    throw new AfipConfigError(
      'AFIP_SIMULATE=true no puede combinarse con AFIP_ENV=produccion. La simulación no habla con el ambiente real.',
    );
  }

  const shared = {
    alicuotaDefaultPct,
    condicionIvaReceptorId,
    concepto,
    razonSocial: emptyToNull(env.AFIP_RAZON_SOCIAL),
    domicilio: emptyToNull(env.AFIP_DOMICILIO),
    iibb: emptyToNull(env.AFIP_IIBB),
    inicioActividades: emptyToNull(env.AFIP_INICIO_ACTIVIDADES),
    timeoutMs,
  };

  if (simulate) {
    return {
      simulate: true,
      simulateResult: readSimulateResult(env.AFIP_SIMULATE_RESULT),
      environment,
      mode: 'simulado',
      urls: null,
      cuit: null,
      ptoVta: null,
      certPath: null,
      keyPath: null,
      ...shared,
    };
  }

  if (!environment) {
    throw new AfipConfigError(
      'AFIP_ENV debe ser homologacion o produccion cuando AFIP_SIMULATE=false.',
    );
  }

  const cuit = requireText(env.AFIP_CUIT, 'AFIP_CUIT');
  if (!/^\d{11}$/.test(cuit)) {
    throw new AfipConfigError('AFIP_CUIT debe tener 11 dígitos, sin guiones.');
  }

  const ptoVta = requirePositiveInt(env.AFIP_PTO_VTA, 'AFIP_PTO_VTA');
  const certPath = requireText(env.AFIP_CERT_PATH, 'AFIP_CERT_PATH');
  const keyPath = requireText(env.AFIP_KEY_PATH, 'AFIP_KEY_PATH');

  if (!fileExists(certPath)) {
    throw new AfipConfigError(
      'No se encontró el certificado configurado en AFIP_CERT_PATH.',
    );
  }
  if (!fileExists(keyPath)) {
    throw new AfipConfigError(
      'No se encontró la clave configurada en AFIP_KEY_PATH.',
    );
  }

  return {
    simulate: false,
    simulateResult: 'authorized',
    environment,
    mode: environment,
    urls: AFIP_URLS[environment],
    cuit,
    ptoVta,
    certPath,
    keyPath,
    ...shared,
  };
}

@Injectable()
export class AfipConfig {
  readonly settings: AfipSettings;

  constructor() {
    this.settings = resolveAfipConfig(process.env);
  }
}

function readSimulate(raw: string | undefined): boolean {
  if (raw === undefined || raw.trim() === '') return SIMULATE_WHEN_UNSET;
  const value = raw.trim().toLowerCase();
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new AfipConfigError('AFIP_SIMULATE debe ser true o false.');
}

function readEnvironment(raw: string | undefined): AfipEnvironment | null {
  if (raw === undefined || raw.trim() === '') return null;
  const value = raw.trim().toLowerCase();
  if ((AFIP_ENVIRONMENTS as readonly string[]).includes(value)) {
    return value as AfipEnvironment;
  }
  throw new AfipConfigError('AFIP_ENV debe ser homologacion o produccion.');
}

function readSimulateResult(raw: string | undefined): AfipSimulateResult {
  if (raw === undefined || raw.trim() === '') return 'authorized';
  const value = raw.trim().toLowerCase();
  if ((AFIP_SIMULATE_RESULTS as readonly string[]).includes(value)) {
    return value as AfipSimulateResult;
  }
  throw new AfipConfigError(
    'AFIP_SIMULATE_RESULT debe ser authorized, rejected o timeout.',
  );
}

function readAlicuota(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return 21;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new AfipConfigError(
      'AFIP_ALICUOTA_DEFAULT_PCT debe ser un porcentaje mayor o igual a 0.',
    );
  }
  return value;
}

function readConcepto(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return 1;
  const value = Number(raw);
  if (value !== 1 && value !== 2 && value !== 3) {
    throw new AfipConfigError('AFIP_CONCEPTO debe ser 1, 2 o 3.');
  }
  return value;
}

function readTimeout(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return 8000;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new AfipConfigError('AFIP_TIMEOUT_MS debe ser un entero mayor a 0.');
  }
  return value;
}

function readOptionalPositiveInt(
  raw: string | undefined,
  name: string,
): number | null {
  if (raw === undefined || raw.trim() === '') return null;
  return requirePositiveInt(raw, name);
}

function requireText(raw: string | undefined, name: string): string {
  const value = raw?.trim() ?? '';
  if (!value) {
    throw new AfipConfigError(
      `Falta ${name} para facturar con AFIP_SIMULATE=false.`,
    );
  }
  return value;
}

function requirePositiveInt(raw: string | undefined, name: string): number {
  const text = requireText(raw, name);
  if (!/^\d+$/.test(text)) {
    throw new AfipConfigError(`${name} debe ser un entero mayor a 0.`);
  }
  const value = Number(text);
  if (!Number.isInteger(value) || value <= 0) {
    throw new AfipConfigError(`${name} debe ser un entero mayor a 0.`);
  }
  return value;
}

function emptyToNull(raw: string | undefined): string | null {
  const value = raw?.trim() ?? '';
  return value ? value : null;
}
