'use client';
import { Box, Stack, Typography } from '@mui/material';
import CashFilters from './Table/CashFilters';
import CashTable from './Table/CashTable';
import { useState } from 'react';
import NewMovementModal from './NewMovement/NewMovementModal';
import { INewMovement, IPayment } from '@/components/Interfaces/IDailyCash';
import NewMovementButton from './NewMovement/NewMovementButton';
import OpenCashButton from './OpenCash/OpenCashButton';
import { dailyCashType } from '@/components/Enums/dailyCash';
import { useDailyCash } from '@/app/context/dailyCashContext';

const DailyCashSection = () => {
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [openMovement, setOpenMovement] = useState(false);

  const { dailyCash, registerMovement } = useDailyCash();

  const handleOpenMovement = () => {
    setOpenMovement(true);
  };

  const handleNewMovement = async (data: {
    movementType: dailyCashType;
    payments: IPayment[];
    description: string;
  }) => {
    if (!dailyCash?.id) return;

    const body: INewMovement = {
      dailyCashId: dailyCash.id,
      movementType: data.movementType.toLowerCase(),
      description: data.description,
      payments: data.payments.map(p => ({
        amount: p.amount,
        paymentMethod: p.paymentMethod.toLowerCase().replace(" ", "_"),
      })),
    };

    await registerMovement(body);
    // mostrar toast o actualizar vista
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
            onConfirm={handleNewMovement}
          />

        </Stack>
      </Stack>
      <CashFilters month={month} year={year} setMonth={setMonth} setYear={setYear} />
      <CashTable />
    </Box>
  );
};

export default DailyCashSection;
