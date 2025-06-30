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
import { Box, Card, CardContent, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { DailyProfit } from "@/components/Interfaces/IMetrics";
import { getDailyProfit } from "@/api/metrics";

const DailyProfitChart = () => {
  const [data, setData] = useState<DailyProfit[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await getDailyProfit(6, 2025);
      setData(response);
    };
    fetchData();
  }, []);

  return (
    <Card elevation={3} sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="subtitle1" mb={2}>
          Ganancia Diaria - junio 2025
        </Typography>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="ganancia"
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
