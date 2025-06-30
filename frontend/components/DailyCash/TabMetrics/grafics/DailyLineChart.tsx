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
import { DailyIncomeExpense } from "@/components/Interfaces/IMetrics";
import { getDailyIncomeExpense } from "@/api/metrics";

const DailyLineChart = () => {
  const [data, setData] = useState<DailyIncomeExpense[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await getDailyIncomeExpense(6, 2025);
      setData(response);
      console.log(data);

    };
    fetchData();
  }, []);

  return (
    <Card elevation={3} sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="subtitle1" mb={2}>
          Ingresos | Egresos - junio 2025
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
              dataKey="ingresos"
              stroke="#76d7c4"
              strokeWidth={2}
              name="Ingresos"
            />
            <Line
              type="monotone"
              dataKey="egresos"
              stroke="#f1948a"
              strokeWidth={2}
              name="Egresos"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default DailyLineChart;
