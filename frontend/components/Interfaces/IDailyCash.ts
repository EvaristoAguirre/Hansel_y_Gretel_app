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



export interface I_DC_ {
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