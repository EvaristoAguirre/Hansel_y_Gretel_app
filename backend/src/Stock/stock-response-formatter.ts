import { Stock } from './stock.entity';

export class StockResponseFormatter {
  // Formato con hasta 2 decimales (para cantidades en stock)
  private static quantityFormatter = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  // Formato sin decimales (para precios y costos)
  private static moneyFormatter = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  static format(stock: Stock): any {
    return {
      ...stock,
      quantityInStock: this.quantityFormatter.format(
        Number(stock.quantityInStock),
      ),
      minimumStock: this.quantityFormatter.format(Number(stock.minimumStock)),
      ingredient: stock.ingredient
        ? {
            ...stock.ingredient,
            cost: this.moneyFormatter.format(Number(stock.ingredient.cost)),
            stock: stock.ingredient.stock
              ? {
                  ...stock.ingredient.stock,
                  quantityInStock: this.quantityFormatter.format(
                    Number(stock.ingredient.stock.quantityInStock),
                  ),
                  minimumStock: this.quantityFormatter.format(
                    Number(stock.ingredient.stock.minimumStock),
                  ),
                }
              : null,
          }
        : null,
      product: stock.product
        ? {
            ...stock.product,
            price: this.moneyFormatter.format(Number(stock.product.price)),
            cost: this.moneyFormatter.format(Number(stock.product.cost)),
            baseCost: this.moneyFormatter.format(
              Number(stock.product.baseCost),
            ),
            toppingsCost: this.moneyFormatter.format(
              Number(stock.product.toppingsCost),
            ),
            stock: stock.product.stock
              ? {
                  ...stock.product.stock,
                  quantityInStock: this.quantityFormatter.format(
                    Number(stock.product.stock.quantityInStock),
                  ),
                  minimumStock: this.quantityFormatter.format(
                    Number(stock.product.stock.minimumStock),
                  ),
                }
              : null,
          }
        : null,
    };
  }

  static formatMany(stocks: Stock[]): any[] {
    return stocks.map((stock) => this.format(stock));
  }
}
