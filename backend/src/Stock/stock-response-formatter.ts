import { Stock } from './stock.entity';

export class StockResponseFormatter {
  static format(stock: Stock): any {
    const formatter = new Intl.NumberFormat('es-Ar', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    return {
      ...stock,
      quantityInStock: formatter.format(Number(stock.quantityInStock)),
      minimumStock: formatter.format(Number(stock.minimumStock)),
    };
  }

  static formatMany(stocks: Stock[]): any[] {
    return stocks.map((stock) => this.format(stock));
  }
}
