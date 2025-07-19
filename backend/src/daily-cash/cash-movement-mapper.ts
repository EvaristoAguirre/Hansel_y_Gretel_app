import { CashMovement } from './cash-movement.entity';
import { formatARNumber } from './formatAR-number';

export class CashMovementMapper {
  static toResponse(movement: CashMovement): any {
    return {
      id: movement.id,
      type: movement.type,
      description: movement.description,
      createdAt: movement.createdAt,
      amount: formatARNumber(movement.amount),
      payments: movement.payments?.map((p) => ({
        ...p,
        amount: formatARNumber(p.amount),
      })),
    };
  }

  static toMany(movements: CashMovement[] = []): any[] {
    return movements.map(this.toResponse);
  }
}
