import { Test } from '@nestjs/testing';
import * as net from 'net';
import { ArcaClient, ArcaSolicitud } from './arca-client';
import { createArcaClient } from './arca-client.factory';
import { resolveAfipConfig } from './afip-config';
import { ArcaSimulator } from './arca-simulator';
import { InvoiceModule } from './invoice.module';

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

const solicitud = (
  cbteNro: number,
  ptoVta = 1,
  cbteTipo = 6,
): ArcaSolicitud => ({
  ptoVta,
  cbteTipo,
  cbteNro,
  cbteFch: '20261012',
  concepto: 1,
  docTipo: 99,
  docNro: 0,
  condicionIvaReceptorId: 0,
  impTotal: 1000,
  impTotConc: 0,
  impNeto: 826.45,
  impOpEx: 0,
  impTrib: 0,
  impIva: 173.55,
  iva: [{ id: 5, baseImp: 826.45, importe: 173.55 }],
});

describe('ArcaSimulator', () => {
  it('autoriza con CAE de 14 dígitos y vencimiento a 10 días', async () => {
    const client = new ArcaSimulator('authorized');
    const result = await client.solicitar(solicitud(1));

    expect(result).toEqual({
      outcome: 'authorized',
      cae: '00000000000001',
      caeFchVto: '20261022',
      reproceso: false,
    });
    expect(await client.consultar(1, 6, 1)).toMatchObject({
      cae: '00000000000001',
    });
    expect(await client.ultimoAutorizado(1, 6)).toBe(1);
  });

  it('un rechazo no autoriza el número y deja un motivo fijo', async () => {
    const client = new ArcaSimulator('rejected');
    const result = await client.solicitar(solicitud(4));

    expect(result.outcome).toBe('rejected');
    if (result.outcome === 'rejected') {
      expect(result.errors[0].msg).toMatch(/simulación/);
    }
    expect(await client.consultar(1, 6, 4)).toBeNull();
    expect(await client.ultimoAutorizado(1, 6)).toBe(0);
  });

  it('un timeout no deja comprobante para consultar', async () => {
    const client = new ArcaSimulator('timeout');
    const result = await client.solicitar(solicitud(8));

    expect(result).toEqual({ outcome: 'timeout' });
    expect(await client.consultar(1, 6, 8)).toBeNull();
    expect(await client.ultimoAutorizado(1, 6)).toBe(0);
  });

  it('la numeración avanza por punto de venta y tipo, y repetir el mismo número es reproceso', async () => {
    const client = new ArcaSimulator('authorized');
    await client.solicitar(solicitud(1, 1, 6));
    await client.solicitar(solicitud(2, 1, 6));
    await client.solicitar(solicitud(1, 2, 6));

    expect(await client.ultimoAutorizado(1, 6)).toBe(2);
    expect(await client.ultimoAutorizado(2, 6)).toBe(1);

    const again = await client.solicitar(solicitud(2, 1, 6));
    expect(again).toMatchObject({
      outcome: 'authorized',
      cae: '00000000000002',
      reproceso: true,
    });
  });

  it('dummy y parámetros responden sin red', async () => {
    const connect = jest.spyOn(net.Socket.prototype, 'connect');
    const client = new ArcaSimulator('authorized');

    await expect(client.dummy()).resolves.toEqual({ ok: true });
    await expect(client.getTiposIva()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ quota: 21 })]),
    );
    await expect(client.getCondicionIvaReceptor()).resolves.toEqual([
      expect.objectContaining({
        desc: expect.stringMatching(/simulado/),
      }),
    ]);
    expect(connect).not.toHaveBeenCalled();
    connect.mockRestore();
  });
});

describe('createArcaClient', () => {
  it('con simulación devuelve el simulador del resultado configurado', async () => {
    const settings = resolveAfipConfig({
      AFIP_SIMULATE: 'true',
      AFIP_SIMULATE_RESULT: 'rejected',
    });
    const client = createArcaClient(settings);
    await expect(client.solicitar(solicitud(1))).resolves.toMatchObject({
      outcome: 'rejected',
    });
  });

  it('sin simulación el proceso puede armar el cliente, y recién la llamada avisa que el SOAP entra en el paso 8', async () => {
    const settings = resolveAfipConfig(
      {
        AFIP_SIMULATE: 'false',
        AFIP_ENV: 'homologacion',
        AFIP_CUIT: '20123456789',
        AFIP_PTO_VTA: '1',
        AFIP_CERT_PATH: '/tmp/cert',
        AFIP_KEY_PATH: '/tmp/key',
      },
      () => true,
    );
    const client = createArcaClient(settings);
    await expect(client.dummy()).rejects.toThrow(/paso 8/);
  });
});

describe('InvoiceModule', () => {
  const previous = {
    simulate: process.env.AFIP_SIMULATE,
    env: process.env.AFIP_ENV,
  };

  afterEach(() => {
    restoreEnv('AFIP_SIMULATE', previous.simulate);
    restoreEnv('AFIP_ENV', previous.env);
  });

  it('entrega el simulador cuando la flag está encendida', async () => {
    process.env.AFIP_SIMULATE = 'true';
    delete process.env.AFIP_ENV;
    const moduleRef = await Test.createTestingModule({
      imports: [InvoiceModule],
    }).compile();

    const client = moduleRef.get(ArcaClient);
    await expect(client.dummy()).resolves.toEqual({ ok: true });
    await moduleRef.close();
  });
});
