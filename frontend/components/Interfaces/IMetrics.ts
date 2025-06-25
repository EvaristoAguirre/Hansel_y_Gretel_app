export interface SummaryResponse {
  ingresos: number;
  egresos: number;
  ganancia: number;
}

export interface MonthlyDistributionItem {
  mes: string;
  ingresos: number;
  egresos: number;
}

export interface DailyIncomeExpense {
  dia: string;
  ingresos: number;
  egresos: number;
}

export interface DailyProfit {
  dia: string;
  ganancia: number;
}

export interface TopProduct {
  producto: string;
  cantidadVendida: number;
}
