import { TableBar } from '@mui/icons-material';
import { Chip, Stack } from '@mui/material';
import { useState } from 'react';

const TablesStatus = () => {
  const initialMesas = [
    { id: 1, color: 'primary' },
    { id: 2, color: 'success' },
    { id: 3, color: 'primary' },
    { id: 4, color: 'success' },
  ];

  const [colorSeleccionado, setColorSeleccionado] = useState<string | null>(null);

  const mesasFiltradas = colorSeleccionado
    ? initialMesas.filter((mesa) => mesa.color === colorSeleccionado)
    : initialMesas;

  return (
    <Stack direction="row" spacing={1}>
      <Chip
        icon={<TableBar />}
        label="primary"
        color="primary"
        onClick={() => setColorSeleccionado('primary')}
      />
      <Chip
        label="success"
        color="success"
        onClick={() => setColorSeleccionado('success')}
      />
      <Chip
        label="todas"
        color="default"
        onClick={() => setColorSeleccionado(null)}
      />
      {mesasFiltradas.map((mesa) => (
        <div key={mesa.id}>{mesa.color}</div>
      ))}
    </Stack>
  );
};

export default TablesStatus;
