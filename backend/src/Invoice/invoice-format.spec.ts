import {
  civilDate,
  comprobanteNumero,
  fiscalLegend,
  formatFiscalDate,
  formatFiscalMoney,
} from './invoice-format';

describe('formato fiscal', () => {
  it('arma fecha, importe y número', () => {
    expect(formatFiscalDate('2026-10-22')).toBe('22/10/2026');
    expect(formatFiscalDate('28/09/2026')).toBe('28/09/2026');
    const postgresDate = new Date(2026, 10, 3);
    expect(civilDate(postgresDate)).toBe('2026-11-03');
    expect(formatFiscalDate(postgresDate)).toBe('03/11/2026');
    expect(String(postgresDate).slice(0, 10)).not.toBe('2026-11-03');
    expect(formatFiscalMoney(4958.68)).toBe('$ 4.958,68');
    expect(formatFiscalMoney(6000)).toBe('$ 6.000,00');
    expect(comprobanteNumero(6, 1)).toBe('0006-00000001');
  });

  it('la leyenda depende del ambiente', () => {
    expect(fiscalLegend('simulado')).toMatch(/SIMULADO/);
    expect(fiscalLegend('homologacion')).toMatch(/HOMOLOGACIÓN/);
    expect(fiscalLegend('produccion')).toBeNull();
  });
});
