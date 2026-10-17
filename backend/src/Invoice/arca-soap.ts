import { execFile } from 'child_process';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import https from 'https';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const WSAA_NS = 'http://wsaa.view.sua.dvadac.desein.afip.gov';
const WSFE_NS = 'http://ar.gov.afip.dif.FEV1/';

export function buildTra(nowMs: number): string {
  const generation = new Date(nowMs - 10 * 60 * 1000);
  const expiration = new Date(generation.getTime() + 12 * 60 * 60 * 1000);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<loginTicketRequest version="1.0">',
    '  <header>',
    `    <uniqueId>${nowMs}</uniqueId>`,
    `    <generationTime>${formatAfip(generation)}</generationTime>`,
    `    <expirationTime>${formatAfip(expiration)}</expirationTime>`,
    '  </header>',
    '  <service>wsfe</service>',
    '</loginTicketRequest>',
  ].join('\n');
}

export function formatAfip(date: Date): string {
  const local = date
    .toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' })
    .replace(' ', 'T');
  return `${local}-03:00`;
}

export function loginEnvelope(cmsBase64: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="${WSAA_NS}">`,
    '  <soapenv:Header/>',
    '  <soapenv:Body>',
    '    <wsaa:loginCms>',
    `      <wsaa:in0><![CDATA[${cmsBase64}]]></wsaa:in0>`,
    '    </wsaa:loginCms>',
    '  </soapenv:Body>',
    '</soapenv:Envelope>',
  ].join('');
}

export function wsfeEnvelope(body: string): string {
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">',
    '  <soap:Body>',
    body,
    '  </soap:Body>',
    '</soap:Envelope>',
  ].join('');
}

export function wsfeAction(method: string): string {
  return `${WSFE_NS}${method}`;
}

export function authXml(token: string, sign: string, cuit: string): string {
  return `<Auth><Token>${escapeXml(token)}</Token><Sign>${escapeXml(sign)}</Sign><Cuit>${cuit}</Cuit></Auth>`;
}

export function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function tag(xml: string, name: string): string | null {
  const match = xml.match(
    new RegExp(
      `<(?:\\w+:)?${name}\\b[^>]*>([\\s\\S]*?)</(?:\\w+:)?${name}>`,
      'i',
    ),
  );
  return match ? decodeXml(match[1].trim()) : null;
}

export function blocks(xml: string, name: string): string[] {
  return [
    ...xml.matchAll(
      new RegExp(
        `<(?:\\w+:)?${name}\\b[^>]*>([\\s\\S]*?)</(?:\\w+:)?${name}>`,
        'gi',
      ),
    ),
  ].map((match) => match[1]);
}

export function faultString(xml: string): string | null {
  return tag(xml, 'faultstring') ?? tag(xml, 'FaultString');
}

export function isClockSkew(message: string): boolean {
  return /generaci[oó]n|generation time|expiraci[oó]n|expiration time|no sincroniz|reloj desfas/i.test(
    message,
  );
}

export interface SoapPoster {
  post(
    url: string,
    action: string,
    envelope: string,
    timeoutMs: number,
  ): Promise<string>;
}

export function httpsSoapPost(
  url: string,
  action: string,
  envelope: string,
  timeoutMs: number,
): Promise<string> {
  const target = new URL(url);
  const body = Buffer.from(envelope, 'utf8');
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || 443,
        path: `${target.pathname}${target.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: action,
          'Content-Length': body.length,
        },
        timeout: timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      },
    );
    req.on('timeout', () => {
      req.destroy(new Error('timeout'));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export function isTimeoutError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /timeout|ETIMEDOUT|ECONNRESET|ECONNABORTED|socket hang up/i.test(
    message,
  );
}

export async function opensslCmsSign(
  traXml: string,
  certPath: string,
  keyPath: string,
): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'afip-tra-'));
  const traPath = join(dir, 'tra.xml');
  const cmsPath = join(dir, 'tra.cms');
  try {
    await writeFile(traPath, traXml, 'utf8');
    await execFileAsync(
      'openssl',
      [
        'cms',
        '-sign',
        '-in',
        traPath,
        '-signer',
        certPath,
        '-inkey',
        keyPath,
        '-out',
        cmsPath,
        '-outform',
        'DER',
        '-nodetach',
      ],
      { timeout: 15000 },
    );
    const der = await readFile(cmsPath);
    return der.toString('base64');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
