export interface FiscalQrInput {
  fecha: string;
  cuit: number;
  ptoVta: number;
  nroCmp: number;
  importe: number;
  codAut: string;
}

export function fiscalQrUrl(input: FiscalQrInput): string {
  const payload = {
    ver: 1,
    fecha: input.fecha,
    cuit: input.cuit,
    ptoVta: input.ptoVta,
    tipoCmp: 6,
    nroCmp: input.nroCmp,
    importe: input.importe,
    moneda: 'PES',
    ctz: 1,
    tipoDocRec: 99,
    nroDocRec: 0,
    tipoCodAut: 'E',
    codAut: Number(input.codAut),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `https://www.afip.gob.ar/fe/qr/?p=${encoded}`;
}
