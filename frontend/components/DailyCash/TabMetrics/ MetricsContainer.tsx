import { Box, Grid, Typography } from "@mui/material";
import AnnualSummary from "./ AnnualSummary";
import DailyLineChart from "./grafics/DailyLineChart";
import DailyProfitChart from "./grafics/DailyProfitChart";
import MonthlySummary from "./MonthlySummary";

const MetricsContainer = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" color="warning" mb={2}>*Métricas Ficticias a modo de representación</Typography>
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
