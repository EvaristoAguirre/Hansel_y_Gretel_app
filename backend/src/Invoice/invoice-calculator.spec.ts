import {
  calculateInvoice,
  InvoiceCalculationError,
} from './invoice-calculator';

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

  it('rechaza una alícuota que no está en el mapa', () => {
    expect(() =>
      calculateInvoice({
        lines: [{ subtotal: 1000, alicQuota: 19 }],
        discountAmount: 0,
        defaultAlicuotaPct: 21,
      }),
    ).toThrow(/alícuota 19/);
  });
});
