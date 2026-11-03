import { EventEmitter } from 'events';
import { Logger } from '@nestjs/common';
import * as https from 'https';
import { resolveAfipConfig } from './afip-config';
import { ArcaSolicitud } from './arca-client';
import { buildTra, httpsSoapPost } from './arca-soap';
import { AfipTokenStore, ArcaWsfeClient } from './arca-wsfe-client';

function settings() {
  return resolveAfipConfig(
    {
      AFIP_SIMULATE: 'false',
      AFIP_ENV: 'homologacion',
      AFIP_CUIT: '20234083202',
      AFIP_PTO_VTA: '5',
      AFIP_CERT_PATH: '/tmp/cert',
      AFIP_KEY_PATH: '/tmp/key',
      AFIP_CONDICION_IVA_RECEPTOR_ID: '5',
    },
    () => true,
  );
}

function store(): AfipTokenStore & { saved: number } {
  let row: {
    token: string;
    sign: string;
    expirationTime: Date;
  } | null = null;
  return {
    saved: 0,
    async findValid(_service, _env, now) {
      if (!row) return null;
      if (row.expirationTime.getTime() < now.getTime() + 5 * 60 * 1000) {
        return null;
      }
      return { token: row.token, sign: row.sign };
    },
    async save(next) {
      this.saved += 1;
      row = next;
    },
  };
}

const loginXml = `<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body><loginCmsResponse><loginCmsReturn>&lt;loginTicketResponse&gt;&lt;header&gt;&lt;expirationTime&gt;2099-01-01T00:00:00-03:00&lt;/expirationTime&gt;&lt;/header&gt;&lt;credentials&gt;&lt;token&gt;TOKEN-1&lt;/token&gt;&lt;sign&gt;SIGN-1&lt;/sign&gt;&lt;/credentials&gt;&lt;/loginTicketResponse&gt;</loginCmsReturn></loginCmsResponse></soapenv:Body></soapenv:Envelope>`;

function caeXml(resultado: string, extra = '') {
  return `<FECAESolicitarResult><FeDetResp><FECAEDetResponse><Resultado>${resultado}</Resultado><CAE>12345678901234</CAE><CAEFchVto>20261027</CAEFchVto>${extra}</FECAEDetResponse></FeDetResp></FECAESolicitarResult>`;
}

const solicitud: ArcaSolicitud = {
  ptoVta: 5,
  cbteTipo: 6,
  cbteNro: 1,
  cbteFch: '20261017',
  concepto: 1,
  docTipo: 99,
  docNro: 0,
  condicionIvaReceptorId: 5,
  impTotal: 121,
  impTotConc: 0,
  impNeto: 100,
  impOpEx: 0,
  impTrib: 0,
  impIva: 21,
  iva: [{ id: 5, baseImp: 100, importe: 21 }],
};

describe('ArcaWsfeClient', () => {
  it('el cliente https expone request', async () => {
    const spy = jest.spyOn(https, 'request').mockImplementation(((
      _options: unknown,
      callback: (res: EventEmitter) => void,
    ) => {
      const req = new EventEmitter();
      process.nextTick(() => {
        const res = new EventEmitter();
        callback(res);
        res.emit('data', Buffer.from('<ok/>'));
        res.emit('end');
      });
      return Object.assign(req, {
        write: () => undefined,
        end: () => undefined,
        destroy: () => undefined,
      });
    }) as unknown as typeof https.request);
    await expect(
      httpsSoapPost(
        'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
        '""',
        '<x/>',
        1000,
      ),
    ).resolves.toBe('<ok/>');
    spy.mockRestore();
  });

  it('el TRA pide wsfe y adelanta la hora de generación', () => {
    const now = Date.parse('2026-10-17T15:00:00Z');
    const xml = buildTra(now);
    expect(xml).toContain('<service>wsfe</service>');
    expect(xml).toContain(`<uniqueId>${Math.floor(now / 1000)}</uniqueId>`);
    expect(xml).toContain('-03:00');
    expect(xml).toContain(
      '<generationTime>2026-10-17T11:50:00-03:00</generationTime>',
    );
  });

  it('autoriza, rechaza y reutiliza el token', async () => {
    const calls: string[] = [];
    const tokens = store();
    const client = new ArcaWsfeClient(
      settings(),
      tokens,
      async (url) => {
        calls.push(url);
        if (url.includes('LoginCms')) return loginXml;
        return caeXml('A');
      },
      async () => 'cms',
    );

    const ok = await client.solicitar(solicitud);
    expect(ok).toMatchObject({
      outcome: 'authorized',
      cae: '12345678901234',
      reproceso: false,
    });

    const again = await client.solicitar(solicitud);
    expect(again).toMatchObject({ outcome: 'authorized' });
    expect(calls.filter((url) => url.includes('LoginCms'))).toHaveLength(1);
    expect(tokens.saved).toBe(1);
  });

  it('un rechazo de ARCA guarda el texto', async () => {
    const client = new ArcaWsfeClient(
      settings(),
      store(),
      async (url) => {
        if (url.includes('LoginCms')) return loginXml;
        return caeXml(
          'R',
          '<Observaciones><Obs><Code>10016</Code><Msg>La fecha está fuera de rango</Msg></Obs></Observaciones>',
        );
      },
      async () => 'cms',
    );
    await expect(client.solicitar(solicitud)).resolves.toEqual({
      outcome: 'rejected',
      errors: [{ code: '10016', msg: 'La fecha está fuera de rango' }],
    });
  });

  it('sin puntos de venta en homologación devuelve una lista vacía', async () => {
    const client = new ArcaWsfeClient(
      settings(),
      store(),
      async (url) => {
        if (url.includes('LoginCms')) return loginXml;
        return '<Errors><Err><Code>602</Code><Msg>Sin Resultados</Msg></Err></Errors>';
      },
      async () => 'cms',
    );
    await expect(client.getPtosVenta()).resolves.toEqual([]);
  });

  it('si el comprobante no existe, la consulta devuelve null', async () => {
    const client = new ArcaWsfeClient(
      settings(),
      store(),
      async (url) => {
        if (url.includes('LoginCms')) return loginXml;
        return '<Errors><Err><Code>602</Code><Msg>No existe</Msg></Err></Errors>';
      },
      async () => 'cms',
    );
    await expect(client.consultar(5, 6, 9)).resolves.toBeNull();
  });

  it('un TRA rechazado por la hora queda en el log', async () => {
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const client = new ArcaWsfeClient(
      settings(),
      store(),
      async () =>
        '<soap:Fault><faultstring>El tiempo de generacion del pedido es posterior a la hora actual</faultstring></soap:Fault>',
      async () => 'cms',
    );
    await expect(client.dummy()).resolves.toEqual({ ok: false });
    await expect(client.ultimoAutorizado(5, 6)).rejects.toThrow(/generacion/);
    expect(error).toHaveBeenCalledWith(expect.stringMatching(/hora desfasada/));
    error.mockRestore();
  });

  it('un corte de red al pedir el CAE queda como timeout', async () => {
    const client = new ArcaWsfeClient(
      settings(),
      store(),
      async (url) => {
        if (url.includes('LoginCms')) return loginXml;
        throw new Error('timeout');
      },
      async () => 'cms',
    );
    await expect(client.solicitar(solicitud)).resolves.toEqual({
      outcome: 'timeout',
    });
  });
});
