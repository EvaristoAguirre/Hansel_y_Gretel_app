import { mockAnnualDistribution, mockAnnualSummary, mockDaily, mockDailyProfit, mockMonthlySummary, mockTopProducts } from "@/components/DailyCash/TabMetrics/mocks";


export const getMonthlySummary = async (month: number, year: number) => {
  return mockMonthlySummary;
};

export const getAnnualSummary = async (year: number) => {
  return mockAnnualSummary;
};

export const getAnnualDistribution = async (year: number) => {
  return mockAnnualDistribution;
};

export const getDailyIncomeExpense = async (month: number, year: number) => {
  return mockDaily;
};

export const getDailyProfit = async (month: number, year: number) => {
  return mockDailyProfit;
};

export const getTopProducts = async (
  unidad: string,
  month?: number,
  year?: number
) => {
  return mockTopProducts;
};
