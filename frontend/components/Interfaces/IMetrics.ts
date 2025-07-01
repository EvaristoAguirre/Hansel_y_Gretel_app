export interface SummaryResponse {
  income: number;
  expenses: number;
  profit: number;
}

export interface MonthlyDistributionItem {
  mes: string;
  income: number;
  expenses: number;
}

export interface DailyIncomeExpense {
  day: string;
  income: number;
  expenses: number;
}

export interface DailyProfit {
  day: string;
  profit: number;
}

export interface TopProduct {
  product: string;
  cantidadVendida: number;
}
