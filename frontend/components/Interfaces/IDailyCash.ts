import { paymentMethod } from "../Enums/dailyCash";

export interface ICashMovement {
  id: string;
  fecha: string;
  ingresos: number;
  egresos: number;
  ganancia: number;
  estado: "Abierta" | "Cerrada";
}

export interface I_DC_Open_Close {
  comment: string;
  initialCash?: number | null;
  finalCash?: number | null;
}

export interface INewMovement {
  dailyCashId?: string;
  movementType: string;
  description: string;
  payments: IPayment[];
}

export interface IPayment {
  amount: number;
  paymentMethod: paymentMethod;
}

export interface IDailyCheck {
  exist: boolean;
  dailyCashOpenId: string | null;
}

export interface IDailyResume {
  incomes?: number;
  expenses?: number;
  result?: string;
}

export interface IDailyCash {
  id?: string;
  comment?: string;
  date?: Date;
  state?: string;
  totalSales?: string;
  totalExpenses?: string;
  newExpense?: string;
  totalPayments?: string;
  initialCash?: string;
  finalCash?: string;
  cashDifference?: string;
  totalCash?: string;
  totalCreditCard?: string;
  totalDebitCard?: string;
  totalTransfer?: string;
  totalMercadoPago?: string;
  totalOtherPayments?: string;
  ordersIds?: string[];
  totalIncomes?: string;
  totalTips?: string;
}

export type OrderCash = {
  id: string;
  date: string;
  table: string;
  room: string;
  numberCustomers: number;
  total: string;
  paymentMethods: Payment[];
  products: Product[];
};

type Payment = {
  methodOfPayment: string;
  amount: string;
};

type Product = {
  name: string;
  quantity: number;
  commandNumber: string;
};

export type MovementCash = {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  payments: { amount: number; paymentMethod: string }[];
};