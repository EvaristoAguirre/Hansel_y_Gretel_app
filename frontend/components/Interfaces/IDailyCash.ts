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
  totalCash?: number | null;

}

export interface INewMovement {
  dailyCashId: string;
  movementType: string;
  description: string;
  payments: IPayment[];
}

export interface IPayment {
  amount: number;
  paymentMethod: string;
}

export interface IDailyCheck {
  exist: boolean;
  dailyCashOpenId: string | null;
}

export interface IDailyCash {
  id?: string;
  comment?: string;
  date?: Date;
  state?: string;
  totalSales?: number;
  totalExpenses?: number;
  newExpense?: number;
  totalPayments?: number;
  totalCash?: number;
  totalCreditCard?: number;
  totalDebitCard?: number;
  totalTransfer?: number;
  totalMercadoPago?: number;
  totalOtherPayments?: number;
  ordersIds?: string[]
}