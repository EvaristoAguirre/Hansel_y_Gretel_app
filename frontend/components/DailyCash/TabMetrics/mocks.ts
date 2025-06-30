import { DailyIncomeExpense, DailyProfit, MonthlyDistributionItem, SummaryResponse, TopProduct } from "@/components/Interfaces/IMetrics";


export const mockMonthlySummary: SummaryResponse = {
  ingresos: 2405000,
  egresos: 500000,
  ganancia: (2405000 - 500000),
};

export const mockAnnualSummary: SummaryResponse = {
  ingresos: 6710000,
  egresos: 1200500,
  ganancia: (6710000 - 1200500),
};

export const mockAnnualDistribution: MonthlyDistributionItem[] = [
  { mes: "enero", ingresos: 10000, egresos: 5000 },
  { mes: "febrero", ingresos: 12000, egresos: 6000 },
];

// Simulamos ingresos y egresos del día 01 al 30
export const mockDaily: DailyIncomeExpense[] = Array.from({ length: 30 }, (_, i) => {
  const ingresos = Math.floor(Math.random() * 2000) + 500; // $500 a $2500
  const egresos = Math.floor(Math.random() * 1500); // $0 a $1500
  return {
    dia: (i + 1).toString().padStart(2, "0"),
    ingresos,
    egresos,
  };
});

// Ganancia como diferencia entre ingresos y egresos
export const mockDailyProfit: DailyProfit[] = mockDaily.map((entry) => ({
  dia: entry.dia,
  ganancia: entry.ingresos - entry.egresos,
}));

export const mockTopProducts: TopProduct[] = [
  { producto: "Pizza Muzzarella", cantidadVendida: 123 },
  { producto: "Empanada de Carne", cantidadVendida: 98 },
];
