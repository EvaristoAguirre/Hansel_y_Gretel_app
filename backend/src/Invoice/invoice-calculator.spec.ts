import {
  calculateInvoice,
  discountFromPercent,
  InvoiceCalculationError,
  previewFiscalTotal,
} from './invoice-calculator';

describe('previewFiscalTotal y descuento', () => {
  it('usa centavos: 100,40 con 10 % deja 90,36', () => {
    expect(discountFromPercent(100.4, 10)).toBe(10.04);
    expect(previewFiscalTotal(100.4, 10)).toBe(90.36);
  });

  it('coincide con calculateInvoice en un neto chico', () => {
    const consumption = 0.4;
    const discountPercent = 0;
    const preview = previewFiscalTotal(consumption, discountPercent);
    const calculated = calculateInvoice({
      lines: [{ subtotal: consumption, alicQuota: 21 }],
      discountAmount: discountFromPercent(consumption, discountPercent),
      defaultAlicuotaPct: 21,
    });
    expect(preview).toBe(calculated.impTotal);
  });
});

describe('calculateInvoice', () => {
  it('desglosa una sola alícuota al 21 %', () => {
    const result = calculateInvoice({
      lines: [{ subtotal: 12100, alicQuota: 21 }],
      discountAmount: 0,
      defaultAlicuotaPct: 21,
    });

    expect(result.impTotal).toBe(12100);
    expect(result.impNeto + result.impIva).toBe(result.impTotal);
    expect(result.iva).toEqual([
      { id: 5, quota: 21, baseImp: 10000, importe: 2100 },
    ]);
    expect(result.impTotConc).toBe(0);
    expect(result.impOpEx).toBe(0);
    expect(result.impTrib).toBe(0);
  });

  it('arma dos ítems de IVA y el descuento cierra en el último grupo', () => {
    const result = calculateInvoice({
      lines: [
        { subtotal: 1210, alicQuota: 21 },
        { subtotal: 1105, alicQuota: 10.5 },
      ],
      discountAmount: 100,
      defaultAlicuotaPct: 21,
    });

    expect(result.iva).toHaveLength(2);
    expect(result.impNeto + result.impIva).toBe(result.impTotal);
    expect(result.impTotal).toBe(2215);
    expect(result.discountAmount).toBe(100);
  });

  it('usa el default cuando la línea no tiene alícuota', () => {
    const result = calculateInvoice({
      lines: [{ subtotal: 1210, alicQuota: null }],
      discountAmount: 0,
      defaultAlicuotaPct: 21,
    });

    expect(result.iva[0].quota).toBe(21);
    expect(result.iva[0].id).toBe(5);
  });

  it('no factura importe cero ni descuento total', () => {
    expect(() =>
      calculateInvoice({
        lines: [{ subtotal: 1000, alicQuota: 21 }],
        discountAmount: 1000,
        defaultAlicuotaPct: 21,
      }),
    ).toThrow(InvoiceCalculationError);

    expect(() =>
      calculateInvoice({
        lines: [{ subtotal: 1000, alicQuota: 21 }],
        discountAmount: 1000,
        defaultAlicuotaPct: 21,
      }),
    ).toThrow(/No se puede facturar un importe cero/);
  });

  it('rechaza una alícuota que no está en el mapa como InvoiceCalculationError', () => {
    expect(() =>
      calculateInvoice({
        lines: [{ subtotal: 1000, alicQuota: 19 }],
        discountAmount: 0,
        defaultAlicuotaPct: 21,
      }),
    ).toThrow(InvoiceCalculationError);
    expect(() =>
      calculateInvoice({
        lines: [{ subtotal: 1000, alicQuota: 19 }],
        discountAmount: 0,
        defaultAlicuotaPct: 21,
      }),
    ).toThrow(/alícuota 19/);
  });

  it('acepta alícuotas 0, 2.5, 5 y 27', () => {
    for (const quota of [0, 2.5, 5, 27]) {
      const result = calculateInvoice({
        lines: [{ subtotal: 1000, alicQuota: quota }],
        discountAmount: 0,
        defaultAlicuotaPct: 21,
      });
      expect(result.iva[0].quota).toBe(quota);
      expect(result.impTotal).toBe(1000);
    }
  });

  it('omite un grupo que el descuento deja en base cero', () => {
    const result = calculateInvoice({
      lines: [
        { subtotal: 100, alicQuota: 10.5 },
        { subtotal: 1, alicQuota: 21 },
      ],
      discountAmount: 100.5,
      defaultAlicuotaPct: 21,
    });
    expect(result.impTotal).toBe(0.5);
    expect(result.iva.every((item) => item.baseImp > 0)).toBe(true);
    expect(result.iva.some((item) => item.quota === 21)).toBe(false);
  });
});
