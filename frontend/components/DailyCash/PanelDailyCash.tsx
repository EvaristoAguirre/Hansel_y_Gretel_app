'use client';
import { Tab, Tabs, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useState } from 'react';
import DailyCashSection from './TabDailyCash/DailyCashSection';
import MetricsContainer from './TabMetrics/ MetricsContainer';
import DailySalesView from './TabSales/DailySalesView';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

function TabPanel({ children, value, index }: { children: React.ReactNode, value: number, index: number }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box mt={2}>{children}</Box>}
    </div>
  );
}

const DailyCash = () => {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box sx={{ pt: '100px', px: 2, minHeight: '100vh', backgroundColor: '#d4d4d4' }}>
      <Tabs value={tabIndex} onChange={(_, newValue) => setTabIndex(newValue)}>
        <Tab label="Caja Diaria" />
        <Tab label="Ventas" />
        <Tab label="Métricas" />
      </Tabs>

      <TabPanel value={tabIndex} index={0}>
        <DailyCashSection />
      </TabPanel>
      <TabPanel value={tabIndex} index={1}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DailySalesView />
        </LocalizationProvider>
      </TabPanel>
      <TabPanel value={tabIndex} index={2}>
        <MetricsContainer />
      </TabPanel>
    </Box>
  );
};

export default DailyCash;
