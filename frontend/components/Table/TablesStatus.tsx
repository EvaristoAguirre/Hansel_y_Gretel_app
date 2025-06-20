import React from 'react';
import Chip from '@mui/material/Chip';
import { TableState } from '../Enums/order';

interface Filter {
  label: string;
  value: string | null;
  color: string;
}

const filters: Filter[] = [
  { label: 'Todas', value: null, color: '#856D5E' },
  { label: 'Disponibles', value: TableState.AVAILABLE, color: '#21b421' },
  { label: 'Ocupadas', value: TableState.OPEN, color: '#d94d22' },
  { label: 'Pendientes de pago', value: TableState.PENDING_PAYMENT, color: '#f9b32d' },
  { label: 'Cerradas', value: TableState.CLOSED, color: '#1f7cad' },
];

interface FilterChipProps {
  currentFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ currentFilter, onFilterChange }) => {
  return (
    <div className="flex gap-2">
      {filters.map((filter) => (
        <Chip
          key={filter.value}
          label={filter.label}
          onClick={() => onFilterChange(filter.value)}
          sx={{
            border: `2px solid ${filter.color}`,
            backgroundColor: currentFilter === filter.value ? filter.color : '#fff3de',
            color: currentFilter === filter.value ? 'white' : 'inherit',
            mt: 2,
            '&:hover': {
              backgroundColor: filter.color,
              color: 'white',
            },
          }}
        />
      ))}
    </div>
  );
};

export default FilterChip;
