import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { AFIP_URLS } from './afip-urls';
import { AfipConfigError, resolveAfipConfig } from './afip-config';

describe('resolveAfipConfig', () => {
  let dir: string;
  let certPath: string;
  let keyPath: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'afip-config-'));
    certPath = path.join(dir, 'cert.crt');
    keyPath = path.join(dir, 'key.key');
    fs.writeFileSync(certPath, 'cert');
    fs.writeFileSync(keyPath, 'key');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const realEnv = (): NodeJS.ProcessEnv => ({
    AFIP_SIMULATE: 'false',
    AFIP_ENV: 'homologacion',
    AFIP_CUIT: '20123456789',
    AFIP_PTO_VTA: '1',
    AFIP_CERT_PATH: certPath,
    AFIP_KEY_PATH: keyPath,
  });

  it('sin variables arranca en simulado y no consulta el certificado', () => {
    const fileExists = jest.fn(() => true);
    const settings = resolveAfipConfig({}, fileExists);

    expect(settings.mode).toBe('simulado');
    expect(settings.simulate).toBe(true);
    expect(settings.urls).toBeNull();
    expect(settings.certPath).toBeNull();
    expect(settings.simulateResult).toBe('authorized');
    expect(settings.alicuotaDefaultPct).toBe(21);
    expect(fileExists).not.toHaveBeenCalled();
  });

  it('simulación con AFIP_ENV=homologacion no abre las URLs de ese ambiente', () => {
    const fileExists = jest.fn(() => true);
    const settings = resolveAfipConfig(
      { AFIP_SIMULATE: 'true', AFIP_ENV: 'homologacion' },
      fileExists,
    );

    expect(settings.mode).toBe('simulado');
    expect(settings.environment).toBe('homologacion');
    expect(settings.urls).toBeNull();
    expect(fileExists).not.toHaveBeenCalled();
  });

  it('simulación con ambiente de producción no arranca', () => {
    expect(() =>
      resolveAfipConfig({
        AFIP_SIMULATE: 'true',
        AFIP_ENV: 'produccion',
      }),
    ).toThrow(AfipConfigError);

    expect(() =>
      resolveAfipConfig({
        AFIP_SIMULATE: 'true',
        AFIP_ENV: 'produccion',
      }),
    ).toThrow(/AFIP_SIMULATE=true no puede combinarse con AFIP_ENV=produccion/);
  });

  it('rechaza un valor de flag que no sea true o false', () => {
    expect(() => resolveAfipConfig({ AFIP_SIMULATE: 'yes' })).toThrow(
      /AFIP_SIMULATE debe ser true o false/,
    );
  });

  it('lee el resultado simulado y rechaza uno desconocido', () => {
    expect(
      resolveAfipConfig({
        AFIP_SIMULATE: 'true',
        AFIP_SIMULATE_RESULT: 'timeout',
      }).simulateResult,
    ).toBe('timeout');

    expect(() =>
      resolveAfipConfig({
        AFIP_SIMULATE: 'true',
        AFIP_SIMULATE_RESULT: 'otro',
      }),
    ).toThrow(/AFIP_SIMULATE_RESULT debe ser authorized, rejected o timeout/);
  });

  it('sin simulación exige ambiente, CUIT, punto de venta y archivos', () => {
    expect(() => resolveAfipConfig({ AFIP_SIMULATE: 'false' })).toThrow(
      /AFIP_ENV debe ser homologacion o produccion/,
    );

    expect(() =>
      resolveAfipConfig({
        AFIP_SIMULATE: 'false',
        AFIP_ENV: 'homologacion',
      }),
    ).toThrow(/AFIP_CUIT/);
  });

  it('en homologación resuelve las URLs de prueba y no las de producción', () => {
    const settings = resolveAfipConfig(realEnv());

    expect(settings.mode).toBe('homologacion');
    expect(settings.urls).toEqual(AFIP_URLS.homologacion);
    expect(settings.cuit).toBe('20123456789');
    expect(settings.ptoVta).toBe(1);
  });

  it('en producción resuelve las URLs reales', () => {
    const settings = resolveAfipConfig({
      ...realEnv(),
      AFIP_ENV: 'produccion',
    });

    expect(settings.mode).toBe('produccion');
    expect(settings.urls).toEqual(AFIP_URLS.produccion);
  });

  it('no arranca si el certificado configurado no está en el disco', () => {
    expect(() =>
      resolveAfipConfig({
        ...realEnv(),
        AFIP_CERT_PATH: path.join(dir, 'no-esta.crt'),
      }),
    ).toThrow(/No se encontró el certificado configurado en AFIP_CERT_PATH/);
  });

  it('rechaza un CUIT con guiones', () => {
    expect(() =>
      resolveAfipConfig({
        ...realEnv(),
        AFIP_CUIT: '20-12345678-9',
      }),
    ).toThrow(/11 dígitos/);
  });
});
