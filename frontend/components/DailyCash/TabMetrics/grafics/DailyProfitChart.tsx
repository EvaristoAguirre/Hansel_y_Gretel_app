import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Select,
  MenuItem,
} from "@mui/material";
import { useEffect, useState } from "react";
import { DailyProfit } from "@/components/Interfaces/IMetrics";
import { getDailyProfit } from "@/api/metrics";
import { useAuth } from "@/app/context/authContext";

const months = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DailyProfitChart = () => {
  const { getAccessToken } = useAuth();
  const token = getAccessToken();

  const currentDate = new Date();
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [year, setYear] = useState<number>(currentDate.getFullYear());
  const [data, setData] = useState<DailyProfit[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      const response = await getDailyProfit(token, month, year);
      setData(response);
    };
    fetchData();
  }, [token, month, year]);

  return (
    <Card elevation={3} sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Typography variant="subtitle1" flexGrow={1}>
            Ganancia Diaria - {months[month - 1]} {year}
          </Typography>
          <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} size="small">
            {months.map((name, idx) => (
              <MenuItem key={idx + 1} value={idx + 1}>
                {name}
              </MenuItem>
            ))}
          </Select>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} size="small">
            {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </Stack>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#bb8fce"
              strokeWidth={2}
              name="Ganancia Diaria"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default DailyProfitChart;
