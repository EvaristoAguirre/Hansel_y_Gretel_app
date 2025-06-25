import { Box, Grid, Typography } from "@mui/material";
import AnnualSummary from "./ AnnualSummary";
import MonthlySummary from "./MonthlySummary";

const MetricsContainer = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <MonthlySummary />
        </Grid>
        <Grid item xs={12} md={6}>
          <AnnualSummary />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MetricsContainer;
