import { useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Select,
  MenuItem,
  Stack,
} from "@mui/material";
import AnnualSummary from "./ AnnualSummary";
import DailyLineChart from "./grafics/DailyLineChart";
import DailyProfitChart from "./grafics/DailyProfitChart";
import MonthlySummary from "./MonthlySummary";

const months = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const MetricsContainer = () => {
  const currentDate = new Date();
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1); // 1-12
  const [year, setYear] = useState<number>(currentDate.getFullYear());

  const handleMonthChange = (event: any) => {
    setMonth(event.target.value);
  };

  const handleYearChange = (event: any) => {
    setYear(event.target.value);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <MonthlySummary />
        </Grid>
        <Grid item xs={12} md={6}>
          <AnnualSummary />
        </Grid>
        <Grid item xs={12} md={6}>
          <DailyLineChart />
        </Grid>
        <Grid item xs={12} md={6}>
          <DailyProfitChart />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MetricsContainer;
