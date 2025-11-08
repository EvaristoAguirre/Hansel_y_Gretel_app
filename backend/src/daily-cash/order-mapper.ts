import { Order } from 'src/Order/order.entity';
import { formatARNumber } from './formatAR-number';

export class OrderMapper {
  static toResponse(order: Order): any {
    return {
      id: order.id,
      date: order.date,
      state: order.state,
      isActive: order.isActive,
      numberCustomers: order.numberCustomers,
      comment: order.comment,
      total: formatARNumber(order.total),
      tip: formatARNumber(order.tip),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      closedAt: order.closedAt,
      payments: order.payments?.map((p) => ({
        ...p,
        amount: formatARNumber(p.amount),
      })),
    };
  }

  static toMany(orders: Order[] = []): any[] {
    return orders.map(this.toResponse);
  }
}
