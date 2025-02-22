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
        sx={{ border: "2px solid #856D5E" }}
        className='bg-[#fff3de] hover:bg-[#856D5E] text-bold mt-2 hover:text-white'
        label="Todas"
        color="default"
        onClick={() => onFilterChange(null)}
      />
      <Chip
        sx={{ border: "2px solid #21b421" }}
        className='bg-[#fff3de] text-bold mt-2 hover:bg-[#21b421] '
        label="Disponibles"
        onClick={() => onFilterChange('available')}
      />
      <Chip
        sx={{ border: "2px solid #d94d22" }}
        className='bg-[#fff3de] hover:bg-[#d94d22] text-bold mt-2 hover:text-white'
        label="Ocupadas"
        onClick={() => onFilterChange('open')}
      />
      <Chip
        sx={{ border: "2px solid #f9b32d" }}
        className='bg-[#fff3de] hover:bg-[#f9b32d] text-bold mt-2'
        label="Pendientes de pago"
        onClick={() => onFilterChange('pending_payment')}
      />
      <Chip
        sx={{ border: "2px solid #21b492" }}
        className='bg-[#fff3de] hover:bg-[#21b492] text-bold mt-2'
        label="Cerradas"
        onClick={() => onFilterChange('closed')}
      />
    </Stack>
  );
};

export default TablesStatus;
