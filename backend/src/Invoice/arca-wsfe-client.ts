import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AfipSettings } from './afip-config';
import { AfipToken } from './afip-token.entity';
import { AFIP_ALICUOTAS } from './afip-alicuotas';
import {
  ArcaClient,
  ArcaComprobante,
  ArcaCondicionIva,
  ArcaObservacion,
  ArcaPuntoVenta,
  ArcaSolicitarResult,
  ArcaSolicitud,
  ArcaTipoIva,
} from './arca-client';
import {
  SoapPoster,
  authXml,
  blocks,
  buildTra,
  faultString,
  httpsSoapPost,
  isClockSkew,
  isTimeoutError,
  loginEnvelope,
  opensslCmsSign,
  tag,
  wsfeAction,
  wsfeEnvelope,
} from './arca-soap';

const TOKEN_MARGIN_MS = 5 * 60 * 1000;
/** El login de WSAA responde cerca de los 11 s. El timeout de facturación sigue en AFIP_TIMEOUT_MS. */
const WSAA_TIMEOUT_MS = 25000;
const WSFE_NS = 'http://ar.gov.afip.dif.FEV1/';

export interface AfipTokenStore {
  findValid(
    service: string,
    afipEnv: 'homologacion' | 'produccion',
    now: Date,
  ): Promise<{ token: string; sign: string } | null>;
  save(row: {
    service: string;
    afipEnv: 'homologacion' | 'produccion';
    token: string;
    sign: string;
    expirationTime: Date;
  }): Promise<void>;
}

export class TypeormTokenStore implements AfipTokenStore {
  constructor(private readonly tokens: Repository<AfipToken>) {}

  async findValid(
    service: string,
    afipEnv: 'homologacion' | 'produccion',
    now: Date,
  ) {
    const row = await this.tokens.findOne({ where: { service, afipEnv } });
    if (!row) return null;
    if (row.expirationTime.getTime() < now.getTime() + TOKEN_MARGIN_MS) {
      return null;
    }
    return { token: row.token, sign: row.sign };
  }

  async save(row: {
    service: string;
    afipEnv: 'homologacion' | 'produccion';
    token: string;
    sign: string;
    expirationTime: Date;
  }) {
    const existing = await this.tokens.findOne({
      where: { service: row.service, afipEnv: row.afipEnv },
    });
    if (existing) {
      existing.token = row.token;
      existing.sign = row.sign;
      existing.expirationTime = row.expirationTime;
      await this.tokens.save(existing);
      return;
    }
    await this.tokens.save(this.tokens.create(row));
  }
}

export class ArcaWsfeClient extends ArcaClient {
  private readonly logger = new Logger(ArcaWsfeClient.name);
  private ticketInflight: Promise<{ token: string; sign: string }> | null =
    null;

  constructor(
    private readonly settings: AfipSettings,
    private readonly tokens: AfipTokenStore,
    private readonly post: SoapPoster['post'] = httpsSoapPost,
    private readonly sign: typeof opensslCmsSign = opensslCmsSign,
  ) {
    super();
  }

  async ultimoAutorizado(ptoVta: number, cbteTipo: number): Promise<number> {
    const xml = await this.call(
      'FECompUltimoAutorizado',
      `${await this.authBlock()}<PtoVta>${ptoVta}</PtoVta><CbteTipo>${cbteTipo}</CbteTipo>`,
    );
    this.assertNoErrors(xml);
    return Number(tag(xml, 'CbteNro') ?? 0);
  }

  async solicitar(solicitud: ArcaSolicitud): Promise<ArcaSolicitarResult> {
    const iva = solicitud.iva
      .map(
        (item) =>
          `<AlicIva><Id>${item.id}</Id><BaseImp>${money(item.baseImp)}</BaseImp><Importe>${money(item.importe)}</Importe></AlicIva>`,
      )
      .join('');
    const body = [
      await this.authBlock(),
      '<FeCAEReq>',
      '<FeCabReq>',
      '<CantReg>1</CantReg>',
      `<PtoVta>${solicitud.ptoVta}</PtoVta>`,
      `<CbteTipo>${solicitud.cbteTipo}</CbteTipo>`,
      '</FeCabReq>',
      '<FeDetReq><FECAEDetRequest>',
      `<Concepto>${solicitud.concepto}</Concepto>`,
      `<DocTipo>${solicitud.docTipo}</DocTipo>`,
      `<DocNro>${solicitud.docNro}</DocNro>`,
      `<CbteDesde>${solicitud.cbteNro}</CbteDesde>`,
      `<CbteHasta>${solicitud.cbteNro}</CbteHasta>`,
      `<CbteFch>${solicitud.cbteFch}</CbteFch>`,
      `<ImpTotal>${money(solicitud.impTotal)}</ImpTotal>`,
      `<ImpTotConc>${money(solicitud.impTotConc)}</ImpTotConc>`,
      `<ImpNeto>${money(solicitud.impNeto)}</ImpNeto>`,
      `<ImpOpEx>${money(solicitud.impOpEx)}</ImpOpEx>`,
      `<ImpTrib>${money(solicitud.impTrib)}</ImpTrib>`,
      `<ImpIVA>${money(solicitud.impIva)}</ImpIVA>`,
      '<MonId>PES</MonId>',
      '<MonCotiz>1</MonCotiz>',
      `<CondicionIVAReceptorId>${solicitud.condicionIvaReceptorId}</CondicionIVAReceptorId>`,
      iva ? `<Iva>${iva}</Iva>` : '',
      '</FECAEDetRequest></FeDetReq>',
      '</FeCAEReq>',
    ].join('');

    let xml: string;
    try {
      xml = await this.call('FECAESolicitar', body);
    } catch (error) {
      if (isTimeoutError(error)) return { outcome: 'timeout' };
      throw error;
    }

    const errors = collectErrors(xml);
    const resultado = tag(xml, 'Resultado');
    const cae = tag(xml, 'CAE');
    if (resultado === 'A' && cae) {
      return {
        outcome: 'authorized',
        cae,
        caeFchVto: tag(xml, 'CAEFchVto') ?? '',
        reproceso: false,
      };
    }
    return {
      outcome: 'rejected',
      errors: errors.length
        ? errors
        : [{ code: 'R', msg: 'ARCA rechazó el comprobante sin detalle.' }],
    };
  }

  async consultar(
    ptoVta: number,
    cbteTipo: number,
    cbteNro: number,
  ): Promise<ArcaComprobante | null> {
    const xml = await this.call(
      'FECompConsultar',
      `${await this.authBlock()}<FeCompConsReq><CbteTipo>${cbteTipo}</CbteTipo><CbteNro>${cbteNro}</CbteNro><PtoVta>${ptoVta}</PtoVta></FeCompConsReq>`,
    );
    const fault = faultString(xml);
    if (fault) throw new Error(fault);
    const errors = collectErrors(xml);
    if (errors.some((error) => error.code === '602' || error.code === '601')) {
      return null;
    }
    if (errors.length && !tag(xml, 'CodAutorizacion') && !tag(xml, 'CAE')) {
      throw new Error(errors.map((error) => error.msg).join(' '));
    }
    const cae = tag(xml, 'CodAutorizacion') ?? tag(xml, 'CAE');
    if (!cae) return null;
    return {
      ptoVta,
      cbteTipo,
      cbteNro,
      cae,
      caeFchVto: tag(xml, 'FchVto') ?? tag(xml, 'CAEFchVto') ?? '',
      impTotal: Number(tag(xml, 'ImpTotal') ?? 0),
    };
  }

  async dummy(): Promise<{ ok: boolean }> {
    const xml = await this.call('FEDummy', '');
    const apps = [
      tag(xml, 'AppServer'),
      tag(xml, 'DbServer'),
      tag(xml, 'AuthServer'),
    ];
    return { ok: apps.every((value) => value === 'OK') };
  }

  async getTiposIva(): Promise<ArcaTipoIva[]> {
    const xml = await this.call('FEParamGetTiposIva', await this.authBlock());
    this.assertNoErrors(xml);
    return blocks(xml, 'IvaTipo').map((item) => {
      const desc = tag(item, 'Desc') ?? '';
      return {
        id: Number(tag(item, 'Id') ?? 0),
        desc,
        quota: quotaFromDesc(desc),
      };
    });
  }

  async getCondicionIvaReceptor(): Promise<ArcaCondicionIva[]> {
    const xml = await this.call(
      'FEParamGetCondicionIvaReceptor',
      await this.authBlock(),
    );
    this.assertNoErrors(xml);
    return blocks(xml, 'CondicionIvaReceptor').map((item) => ({
      id: Number(tag(item, 'Id') ?? 0),
      desc: tag(item, 'Desc') ?? '',
    }));
  }

  async getPtosVenta(): Promise<ArcaPuntoVenta[]> {
    const xml = await this.call('FEParamGetPtosVenta', await this.authBlock());
    this.assertNoErrors(xml);
    return blocks(xml, 'PtoVenta')
      .filter((item) => !tag(item, 'FchBaja'))
      .map((item) => ({ nro: Number(tag(item, 'Nro') ?? 0) }));
  }

  private async call(method: string, inner: string): Promise<string> {
    const urls = this.settings.urls;
    if (!urls) throw new Error('ARCA no tiene URLs para este modo.');
    const envelope = wsfeEnvelope(
      `<${method} xmlns="${WSFE_NS}">${inner}</${method}>`,
    );
    return this.post(
      urls.wsfe,
      wsfeAction(method),
      envelope,
      this.settings.timeoutMs,
    );
  }

  private async authBlock(): Promise<string> {
    const ticket = await this.ticket();
    return authXml(ticket.token, ticket.sign, this.requireCuit());
  }

  private ticket(): Promise<{ token: string; sign: string }> {
    if (!this.ticketInflight) {
      this.ticketInflight = this.loadTicket().finally(() => {
        this.ticketInflight = null;
      });
    }
    return this.ticketInflight;
  }

  private async loadTicket(): Promise<{ token: string; sign: string }> {
    const env = this.settings.environment;
    const urls = this.settings.urls;
    if (!env || !urls) throw new Error('ARCA no tiene ambiente configurado.');
    const cached = await this.tokens.findValid('wsfe', env, new Date());
    if (cached) return cached;

    const tra = buildTra(Date.now());
    const cms = await this.sign(
      tra,
      this.settings.certPath ?? '',
      this.settings.keyPath ?? '',
    );
    const xml = await this.post(
      urls.wsaa,
      '""',
      loginEnvelope(cms),
      Math.max(this.settings.timeoutMs, WSAA_TIMEOUT_MS),
    );
    const fault = faultString(xml);
    if (fault) {
      if (isClockSkew(fault)) {
        this.logger.error(`TRA rechazado por hora desfasada: ${fault}`);
      }
      throw new Error(fault);
    }
    const ticketXml = tag(xml, 'loginCmsReturn') ?? xml;
    const token = tag(ticketXml, 'token');
    const sign = tag(ticketXml, 'sign');
    const expiration = tag(ticketXml, 'expirationTime');
    if (!token || !sign || !expiration) {
      throw new Error('WSAA no devolvió token.');
    }
    const expirationTime = new Date(expiration);
    await this.tokens.save({
      service: 'wsfe',
      afipEnv: env,
      token,
      sign,
      expirationTime,
    });
    return { token, sign };
  }

  private requireCuit(): string {
    if (!this.settings.cuit) throw new Error('Falta el CUIT de ARCA.');
    return this.settings.cuit;
  }

  private assertNoErrors(xml: string) {
    const fault = faultString(xml);
    if (fault) throw new Error(fault);
    const errors = collectErrors(xml);
    if (errors.length) {
      throw new Error(
        errors.map((error) => `${error.code} ${error.msg}`).join(' '),
      );
    }
  }
}

export function compararAlicuotas(remotos: ArcaTipoIva[]) {
  return AFIP_ALICUOTAS.map((item) => {
    const remote = remotos.find((tipo) => tipo.id === item.id);
    return {
      id: item.id,
      quota: item.quota,
      remoteDesc: remote?.desc ?? null,
      coincide: remote ? Math.abs(remote.quota - item.quota) < 0.001 : false,
    };
  });
}

function quotaFromDesc(desc: string): number {
  const match = desc.replace(',', '.').match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? Number(match[1]) : Number.NaN;
}

function collectErrors(xml: string): ArcaObservacion[] {
  const nodes = [...blocks(xml, 'Err'), ...blocks(xml, 'Obs')];
  return nodes
    .map((node) => ({
      code: tag(node, 'Code') ?? '',
      msg: tag(node, 'Msg') ?? '',
    }))
    .filter((error) => error.code || error.msg);
}

function money(value: number): string {
  return Number(value).toFixed(2);
}
