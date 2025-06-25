import { DailyIncomeExpense, DailyProfit, MonthlyDistributionItem, SummaryResponse, TopProduct } from "@/components/Interfaces/IMetrics";


export const mockMonthlySummary: SummaryResponse = {
  ingresos: 0,
  egresos: 0,
  ganancia: 0,
};

export const mockAnnualSummary: SummaryResponse = {
  ingresos: 100,
  egresos: NaN,
  ganancia: 50,
};

export const mockAnnualDistribution: MonthlyDistributionItem[] = [
  { mes: "enero", ingresos: 10000, egresos: 5000 },
  { mes: "febrero", ingresos: 12000, egresos: 6000 },
];

export const mockDaily: DailyIncomeExpense[] = [
  { dia: "01", ingresos: 500, egresos: 200 },
  { dia: "02", ingresos: 600, egresos: 100 },
];

export const mockDailyProfit: DailyProfit[] = [
  { dia: "01", ganancia: 300 },
  { dia: "02", ganancia: 500 },
];

export const mockTopProducts: TopProduct[] = [
  { producto: "Pizza Muzzarella", cantidadVendida: 123 },
  { producto: "Empanada de Carne", cantidadVendida: 98 },
];
