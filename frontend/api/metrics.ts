import { URI_METRICS } from "@/components/URI/URI";

// Ingresos y egresos diarios del mes: 
export const getMonthlySummary = async (token: string, month: number, year: number) => {
  const response = await fetch(
    `${URI_METRICS}/daily?month=${month}&year=${year}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    }
  );
  const data = await response.json();
  return data;
};


export const getAnnualSummary = async (token: string, year: number) => {
  const response = await fetch(
    `${URI_METRICS}/annual?year=${year}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    }
  );
  const data = await response.json();
  return data;
};


export const getAnnualDistribution = async (token: string, year: number) => {
  const response = await fetch(
    `${URI_METRICS}/annual-distribution?year=${year}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    }
  );
  const data = await response.json();
  return data;
};


export const getDailyIncomeExpense = async (token: string, month: number, year: number) => {
  const response = await fetch(
    `${URI_METRICS}/daily?month=${month}&year=${year}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    }
  );
  const data = await response.json();
  return data;
};


export const getDailyProfit = async (token: string, month: number, year: number) => {
  const response = await fetch(
    `${URI_METRICS}/daily-profit?month=${month}&year=${year}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    }
  );
  const data = await response.json();
  return data;
};



