import { TableBar } from '@mui/icons-material';
import { Chip, Stack } from '@mui/material';
import React from 'react';

interface TablesStatusProps {
  currentFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

const TablesStatus: React.FC<TablesStatusProps> = ({ currentFilter, onFilterChange }) => {

  return (
    <Stack direction="row" spacing={1}>
      <Chip
        className='bg-[#21b421] text-bold mt-2'
        icon={<TableBar />}
        label="Disponibles"
        onClick={() => onFilterChange('available')}
        variant={currentFilter === 'available' ? "filled" : "outlined"}
      />
      <Chip
        className='bg-[#d94d22] text-bold mt-2'
        label="Ocupadas"
        onClick={() => onFilterChange('open')}
        variant={currentFilter === 'open' ? "filled" : "outlined"}
      />
      <Chip
        className='bg-[#f9b32d] text-bold mt-2'
        label="Pendientes de pago"
        onClick={() => onFilterChange('pending_payment')}
        variant={currentFilter === 'pending_payment' ? "filled" : "outlined"}
      />
      <Chip
        className='bg-[#21b492] text-bold mt-2'
        label="Cerradas"
        onClick={() => onFilterChange('closed')}
        variant={currentFilter === 'closed' ? "filled" : "outlined"}
      />
      <Chip
        label="Todas"
        color="default"
        onClick={() => onFilterChange(null)}
        variant={currentFilter === null ? "filled" : "outlined"}
      />
    </Stack>
  );
};

export default TablesStatus;
