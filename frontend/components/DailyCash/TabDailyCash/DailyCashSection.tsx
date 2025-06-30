'use client';
import { Box, Stack, Typography } from '@mui/material';
import CashFilters from './Table/CashFilters';
import CashTable from './Table/CashTable';
import { useState } from 'react';
import NewMovementModal from './NewMovement/NewMovementModal';
import { INewMovement, IPayment } from '@/components/Interfaces/IDailyCash';
import { useDailyCash } from '@/app/context/dailyCashContext';
import { dailyCashType } from '@/components/Enums/dailyCash';
import OpenCashButton from './Open_CloseDailyCash/OpenCashButton';
import NewMovementButton from './NewMovement/NewMovementButton';

const DailyCashSection = () => {

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
    if (!dailyCash?.dailyCashOpenId) return;

    const body: INewMovement = {
      dailyCashId: dailyCash.dailyCashOpenId,
      movementType: data.movementType.toLowerCase(),
      description: data.description,
      payments: data.payments.map(p => ({
        amount: p.amount,
        paymentMethod: p.paymentMethod
      })),
    };

    await registerMovement(body);
    // mostrar toast o actualizar vista
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" alignItems="center" mb={3} mt={2}>
        <Stack direction="row" spacing={2}>
          <OpenCashButton />
          <NewMovementButton handleNewMovement={handleOpenMovement} />

          <NewMovementModal
            open={openMovement}
            onClose={() => setOpenMovement(false)}
          />

        </Stack>
      </Stack>
      <CashTable />
    </Box>
  );
};

export default DailyCashSection;
