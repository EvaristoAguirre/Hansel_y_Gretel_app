import { DailyCashMovementType } from 'src/Enums/dailyCash.enum';
import { PaymentMethod } from 'src/Enums/paymentMethod.enum';

export type PaymentRecord = {
  amount: number;
  method: PaymentMethod;
  type: DailyCashMovementType | 'sale';
};
