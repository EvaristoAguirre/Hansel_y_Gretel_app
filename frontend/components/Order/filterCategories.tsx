import {
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { useState } from 'react';
import { ICategory } from '../Interfaces/ICategories';



interface CategorySelectorProps {
  categories: ICategory[];
  selected: (string)[];
  onChangeSelected: (selected: (string)[]) => void;
}

export const CategorySelector = ({
  categories,
  selected,
  onChangeSelected,
}: CategorySelectorProps) => {
  const [showCategories, setShowCategories] = useState(false);
  const [sortOption, setSortOption] = useState('name-asc');

  const handleToggle = () => {
    setShowCategories((prev) => !prev);
  };

  const handleSortChange = (e: SelectChangeEvent) => {
    setSortOption(e.target.value);
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    onChangeSelected(
      checked ? [...selected, id] : selected.filter((s) => s !== id)
    );
  };

  const sortedCategories = [...categories].sort((a, b) => {
    if (sortOption === 'name-asc') {
      return a.name.localeCompare(b.name);
    }
    if (sortOption === 'name-desc') {
      return b.name.localeCompare(a.name);
    }
    return 0;
  });

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>

      <Button
        variant="outlined"
        size="small"
        onClick={handleToggle}
        sx={{ my: 1, width: 1 / 2, height: '40px' }}
      >
        {showCategories ? 'Ocultar categorías' : 'Mostrar categorías'}
      </Button>

      {
        showCategories ?
          <FormControl size="small" sx={{ mt: 1, width: 1 / 4, minWidth: 200 }}>
            <InputLabel>Ordenar por</InputLabel>
            <Select value={sortOption} label="Ordenar por" onChange={handleSortChange}>
              <MenuItem value="name-asc">Nombre (A-Z)</MenuItem>
              <MenuItem value="name-desc">Nombre (Z-A)</MenuItem>
            </Select>
          </FormControl>
          : null
      }

      <Collapse in={showCategories}>
        <Box
          sx={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: 2,
            marginBottom: 1,
            maxHeight: 300,
            overflowY: 'auto',
          }}
        >
          <FormGroup
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: '1fr 1fr 1fr',
              },
              gap: 1,
            }}
          >
            {sortedCategories.map((cat) => (
              <FormControlLabel
                key={cat.id}
                control={
                  <Checkbox
                    size="small"
                    checked={selected.includes(cat.id)}
                    onChange={(e) =>
                      handleCheckboxChange(cat.id, e.target.checked)
                    }
                  />
                }
                label={capitalize(cat.name)}
              />
            ))}
          </FormGroup>
        </Box>
      </Collapse>


    </Box>
  );
};
