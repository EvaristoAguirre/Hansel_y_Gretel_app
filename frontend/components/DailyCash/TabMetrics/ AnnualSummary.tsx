import SummaryCard from "./SummaryCard";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { useEffect, useState } from "react";
import { SummaryResponse } from "@/components/Interfaces/IMetrics";
import { getAnnualSummary } from "@/api/metrics";
import { useAuth } from "@/app/context/authContext";
import { Box, Stack, Typography, Select, MenuItem } from "@mui/material";

const AnnualSummary = () => {
  const { getAccessToken } = useAuth();
  const token = getAccessToken();

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [data, setData] = useState<SummaryResponse>({
    income: 0,
    expenses: 0,
    profit: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      const response = await getAnnualSummary(token, year);
      setData(response);
    };
    fetchData();
  }, [token, year]);

  const handleYearChange = (event: any) => {
    setYear(event.target.value);
  };

  return (
    <Box sx={{ backgroundColor: "primary.light", p: 2, borderRadius: 3 }}>
      <Stack direction="row" spacing={2} mb={2} alignItems="center" justifyContent="flex-end">
        <Select value={year} onChange={handleYearChange} size="small">
          {[2023, 2024, 2025, 2026].map((y) => (
            <MenuItem key={y} value={y}>
              {y}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      <SummaryCard
        title="Métricas Anuales"
        income={data.income}
        expenses={data.expenses}
        profit={data.profit}
        icon={<CalendarTodayIcon color="primary" />}
      />
    </Box>
  );
};

export default AnnualSummary;
