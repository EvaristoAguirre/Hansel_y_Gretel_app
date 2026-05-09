import React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import { ProductResponse } from '../Interfaces/IProducts';
import { capitalizeFirstLetter } from './CapitalizeFirstLetter';
import { TypeProduct } from '../Enums/view-products';

interface AutoCompleteProductProps {
  options: ProductResponse[];
  onSearch: (value: string) => void;
  onSelect: (product: any) => void;
  label?: string;
  sx?: any;
}
const AutoCompleteProduct: React.FC<AutoCompleteProductProps> = ({
  options,
  onSearch,
  onSelect,
  label = 'Buscar productos por nombre o código',
  sx = { flexGrow: 1, width: '100%', marginRight: 2 },
}) => {
  return (
    <Autocomplete
      sx={sx}
      options={options}
      getOptionLabel={(product) =>
        `${product.name} - (Código: ${product.code})`
      }
      getOptionDisabled={(product) => {
        if (product.type !== TypeProduct.SIMPLE) return false;
        const qty = parseFloat(product.stock?.quantityInStock ?? '0');
        return qty <= 0;
      }}
      onInputChange={(event, value) => onSearch(value)}
      onChange={(event, selectedProduct) => {
        if (selectedProduct) {
          onSelect(selectedProduct);
        }
      }}
      renderInput={(params) => (
        <TextField {...params} label={label} variant="outlined" fullWidth />
      )}
      renderOption={(props, product) => {
        const isSimple = product.type === TypeProduct.SIMPLE;
        const stockQty = isSimple
          ? parseFloat(product.stock?.quantityInStock ?? '0')
          : null;
        const sinStock = isSimple && stockQty !== null && stockQty <= 0;

        return (
          <li {...props} key={String(product.id)}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                gap: 1,
              }}
            >
              <span>
                {`${capitalizeFirstLetter(product.name)}  - (Código: ${product.code})`}
              </span>
              {isSimple && stockQty !== null && (
                <Chip
                  label={sinStock ? 'Sin stock' : stockQty}
                  size="small"
                  color={sinStock ? 'warning' : 'success'}
                  sx={{ minWidth: 36, fontSize: '0.7rem', flexShrink: 0 }}
                />
              )}
            </Box>
          </li>
        );
      }}
    />
  );
};

export default AutoCompleteProduct;
