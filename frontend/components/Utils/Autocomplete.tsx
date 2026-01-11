import React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { ProductResponse } from "../Interfaces/IProducts";
import { capitalizeFirstLetter } from "./CapitalizeFirstLetter";

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
  label = "Buscar productos por nombre o código",
  sx = { flexGrow: 1, width: "100%", marginRight: 2 },
}) => {
  // Filtrar solo productos con stock disponible
  const availableOptions = options.filter((product) => {
    const stockQuantity = parseFloat(product.stock?.quantityInStock || "0");
    return stockQuantity > 0;
  });

  return (
    <Autocomplete
      sx={sx}
      options={availableOptions}
      getOptionLabel={(product) =>
        `${product.name} - (Código: ${product.code})`
      }
      onInputChange={(event, value) => onSearch(value)}
      onChange={(event, selectedProduct) => {
        if (selectedProduct) {
          onSelect(selectedProduct);
        }
      }}
      renderInput={(params) => (
        <TextField {...params} label={label} variant="outlined" fullWidth />
      )}
      renderOption={(props, product) => (
        <li {...props} key={String(product.id)}>
          {`${capitalizeFirstLetter(product.name)}  - (Código: ${
            product.code
          })`}
        </li>
      )}
    />
  );
};

export default AutoCompleteProduct;
