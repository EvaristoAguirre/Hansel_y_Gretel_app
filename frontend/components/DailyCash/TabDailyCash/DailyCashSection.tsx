'use client';
import { Box, Stack, Typography } from '@mui/material';
import OpenCashButton from './OpenCash/OpenCashButton';
import NewMovementButton from './NewMovement/NewMovementButton';
import CashFilters from './Table/CashFilters';
import CashTable from './Table/CashTable';
import { useState } from 'react';
import NewMovementModal from './NewMovement/NewMovementModal';

const DailyCashSection = () => {
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [openMovement, setOpenMovement] = useState(false);

  const handleOpenMovement = () => {
    setOpenMovement(true);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} mt={2}>
        <Typography variant="h5">Caja Diaria</Typography>
        <Stack direction="row" spacing={2}>
          <OpenCashButton />
          <NewMovementButton handleNewMovement={handleOpenMovement} />

          <NewMovementModal
            open={openMovement}
            onClose={() => setOpenMovement(false)}
            onConfirm={(data) => {
              console.log("Movimiento confirmado", data);
              setOpenMovement(false);
            }}
          />
        </Stack>
      </Stack>
      <CashFilters month={month} year={year} setMonth={setMonth} setYear={setYear} />
      <CashTable />
    </Box>
  );
};

export default DailyCashSection;
