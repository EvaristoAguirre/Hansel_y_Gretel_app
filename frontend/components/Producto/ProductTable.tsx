import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Box, Autocomplete, TextField } from "@mui/material";
import { ProductTableProps } from "../Interfaces/IProducts";
import { useProductStore } from "../Hooks/useProductStore";

export const ProductTable: React.FC<ProductTableProps> = ({
  columns,
  onCreate,
}) => {
  const { products } = useProductStore(); // Obtener todos los productos
  const [searchResults, setSearchResults] = useState(products); // Productos filtrados
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]); // Productos seleccionados

  // Actualizar los resultados de búsqueda cuando `products` cambie
  useEffect(() => {
    setSearchResults(products);
  }, [products]);

  // Actualizar los productos seleccionados al cambiar `products`
  // Actualizar los productos seleccionados al cambiar `products`
  useEffect(() => {
    const updatedSelectedProducts = selectedProducts.map((selectedProduct) =>
      products.find((product) => product.id === selectedProduct.id) || selectedProduct
    );
    setSelectedProducts(updatedSelectedProducts);
  }, [products]);


  // Manejar búsqueda de productos
  const handleSearch = (value: string) => {
    const searchTerm = value.toLowerCase();
    if (searchTerm) {
      const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.code.toString().toLowerCase().includes(searchTerm)
      );
      setSearchResults(filteredProducts);
    } else {
      setSearchResults(products); // Mostrar todos los productos si no hay término de búsqueda
    }
  };

  // Manejar selección de un producto
  const handleSelectProduct = (product: any) => {
    if (!selectedProducts.find((p) => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  // Limpiar búsqueda y mostrar todos los productos
  const handleClearSearch = () => {
    setSearchResults(products);
    setSelectedProducts([]);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        {/* Botón para crear nuevo producto */}
        <Button
          variant="contained"
          color="primary"
          sx={{ marginRight: 2, width: '20%' }}
          onClick={onCreate}
        >
          + Nuevo
        </Button>

        {/* Buscador de productos */}
        <Autocomplete
          sx={{ flexGrow: 1, width: '60%', marginRight: 2 }}
          options={products}
          getOptionLabel={(product) =>
            `${product.name} - $${product.price} (Código: ${product.code})`
          }
          onInputChange={(event, value) => handleSearch(value)}
          onChange={(event, selectedProduct) => {
            if (selectedProduct) {
              handleSelectProduct(selectedProduct);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Buscar productos por nombre o código"
              variant="outlined"
              fullWidth
            />
          )}
          renderOption={(props, product) => (
            <li {...props} key={String(product.id)}>
              {`${product.name} - $${product.price} (Código: ${product.code})`}
            </li>
          )}
        />
        {/* Botón para limpiar búsqueda */}
        <Button
          sx={{ flexGrow: 1, width: '20%' }}
          variant="outlined"
          color="primary"
          onClick={handleClearSearch}
        >
          Limpiar Búsqueda
        </Button>
      </Box>
      {/* Tabla de productos */}
      <Box sx={{ height: 450, mt: 2 }}>
        <DataGrid
          rows={selectedProducts.length > 0 ? selectedProducts : searchResults}
          columns={columns}
        />
      </Box>
    </Box>
  );
};
