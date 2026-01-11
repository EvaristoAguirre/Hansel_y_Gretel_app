import SummaryCard from "./SummaryCard";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/authContext";
import { getMonthlySummary } from "@/api/metrics";
import {
  Box,
  Stack,
  Typography,
  Select,
  MenuItem,
} from "@mui/material";

interface DailyEntry {
  day: string;
  income: number;
  expenses: number;
}

const months = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const MonthlySummary = () => {
  const { getAccessToken } = useAuth();
  const token = getAccessToken();

  const currentDate = new Date();
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [year, setYear] = useState<number>(currentDate.getFullYear());

  const [data, setData] = useState({
    income: 0,
    expenses: 0,
    profit: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      const dailyData: DailyEntry[] = await getMonthlySummary(token, month, year);

      const totals = dailyData.reduce(
        (acc, curr) => {
          acc.income += curr.income || 0;
          acc.expenses += curr.expenses || 0;
          return acc;
        },
        { income: 0, expenses: 0 }
      );

      setData({
        income: totals.income,
        expenses: totals.expenses,
        profit: totals.income - totals.expenses,
      });
    };

    fetchData();
  }, [token, month, year]);

  return (
    <Box sx={{ backgroundColor: "primary.light", p: 2, borderRadius: 3, opacity: 0.9 }}>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} size="small">
          {months.map((name, idx) => (
            <MenuItem key={idx + 1} value={idx + 1}>
              {name}
            </MenuItem>
          ))}
        </Select>

        <Select value={year} onChange={(e) => setYear(Number(e.target.value))} size="small"
        >
          {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
            <MenuItem key={y} value={y}>
              {y}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      <SummaryCard
        title={`Métricas Mensuales - ${months[month - 1]} ${year}`}
        income={data.income}
        expenses={data.expenses}
        profit={data.profit}
        icon={<CalendarMonthIcon color="primary" />}
      />
    </Box>
  );
};

export default MonthlySummary;
