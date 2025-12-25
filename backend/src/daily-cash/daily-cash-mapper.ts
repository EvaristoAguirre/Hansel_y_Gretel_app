import { CashMovementMapper } from './cash-movement-mapper';
import { DailyCash } from './daily-cash.entity';
import { formatARNumber } from './formatAR-number';
import { OrderMapper } from './order-mapper';

export class DailyCashMapper {
  static toResponse(dailyCash: DailyCash): any {
    return {
      id: dailyCash.id,
      date: dailyCash.date,
      state: dailyCash.state,
      comment: dailyCash.comment,
      totalSales: formatARNumber(dailyCash.totalSales),
      totalPayments: formatARNumber(dailyCash.totalPayments),
      initialCash: formatARNumber(dailyCash.initialCash),
      finalCash: formatARNumber(dailyCash.finalCash),
      totalCash: formatARNumber(dailyCash.totalCash),
      totalTips: formatARNumber(dailyCash.totalTips),
      cashDifference: formatARNumber(dailyCash.cashDifference),
      totalCreditCard: formatARNumber(dailyCash.totalCreditCard),
      totalDebitCard: formatARNumber(dailyCash.totalDebitCard),
      totalTransfer: formatARNumber(dailyCash.totalTransfer),
      totalMercadoPago: formatARNumber(dailyCash.totalMercadoPago),
      totalIncomes: formatARNumber(dailyCash.totalIncomes),
      totalExpenses: formatARNumber(dailyCash.totalExpenses),
      movements: CashMovementMapper.toMany(dailyCash.movements || []),
      orders: OrderMapper.toMany(dailyCash.orders || []),
    };
  }

  static toMany(dailyCashes: DailyCash[] = []): any[] {
    return dailyCashes.map(this.toResponse);
  }
}
