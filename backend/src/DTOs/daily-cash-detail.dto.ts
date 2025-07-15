import { DailyCashMovementType } from 'src/Enums/dailyCash.enum';
import { PaymentMethod } from 'src/Enums/paymentMethod.enum';

export class OrderDetailsDto {
  id: string;
  date: Date;
  table: string;
  room: string;
  numberCustomers: number;
  total: string;
  paymentMethods: {
    methodOfPayment: string;
    amount: string;
  }[];
  products: {
    name: string;
    quantity: number;
    commandNumber: string;
  }[];
}

export class CashMovementDetailsDto {
  type: DailyCashMovementType;
  amount: number;
  createdAt: Date;
  payments: {
    amount: number;
    paymentMethod: PaymentMethod;
  }[];
}
