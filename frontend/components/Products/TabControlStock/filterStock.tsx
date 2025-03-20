import React from 'react';
import Chip from '@mui/material/Chip';

const stockFilters = [
  { label: 'Todos', value: null, color: '#856D5E' },
  { label: 'Stock Bajo', value: 'low', color: '#d94d22' },
  { label: 'Stock Medio', value: 'medium', color: '#f9b32d' },
  { label: 'Stock Alto', value: 'high', color: '#21b421' },
];

const FilterStock = ({ currentFilter, onFilterChange }) => {
  return (
    <div className="flex gap-2">
      {stockFilters.map((filter) => (
        <Chip
          key={filter.value}
          label={filter.label}
          onClick={() => onFilterChange(filter.value)}
          sx={{
            border: `2px solid ${filter.color}`,
            backgroundColor: currentFilter === filter.value ? filter.color : '#fff3de',
            // color: currentFilter === filter.value ? 'white' : 'inherit',
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

export default FilterStock;
