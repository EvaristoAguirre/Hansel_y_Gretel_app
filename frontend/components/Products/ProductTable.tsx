import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Box, Autocomplete, TextField } from "@mui/material";
import { ProductTableProps } from "../Interfaces/IProducts";
import { useProductStore } from "../Hooks/useProductStore";
import { esES } from "@mui/x-data-grid/locales/esES";
import { getProductsByCategory } from "@/helpers/products";
import { useProductos } from '../Hooks/useProducts';

export const ProductTable: React.FC<ProductTableProps> = ({
  columns,
  onCreate,
  selectedCategoryId,
  onClearSelectedCategory,
}) => {
  const { products, setProducts } = useProductStore(); // Obtener todos los productos
  const { fetchAndSetProducts } = useProductos();
  const [searchResults, setSearchResults] = useState(products); // Productos filtrados
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]); // Productos seleccionados

  // Actualizar los resultados de búsqueda cuando `products` cambie
  useEffect(() => {
    setSearchResults(products);
  }, [products]);

  // Actualizar los productos seleccionados al cambiar `products`
  useEffect(() => {
    const updatedSelectedProducts = selectedProducts.map((selectedProduct) =>
      products.find((product) => product.id === selectedProduct.id) || selectedProduct
    );
    setSelectedProducts(updatedSelectedProducts);
  }, [products]);

  useEffect(() => {
    if (selectedCategoryId) {
      const fetchProductsByCategory = async () => {
        const response = await getProductsByCategory(selectedCategoryId);

        if (!response.ok) {
          console.warn("No se encontraron productos o hubo un error:", response.message);
          setProducts([]);
          return;
        }

        const productsWithCategories = response.data.map((product: any) => ({
          ...product,
          categories: [selectedCategoryId],
        }));

        setProducts(productsWithCategories);
      };

      fetchProductsByCategory();
    } else {
      fetchAndSetProducts();
    }
  }, [selectedCategoryId]);


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
    console.log('Handle Select Product', product);
    if (!selectedProducts.find((p) => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
    }
    else {
      setSelectedProducts(selectedProducts.filter((p) => p.id !== product.id));
    };
  };

  // Limpiar búsqueda y mostrar todos los productos
  const handleClearSearch = () => {
    fetchAndSetProducts();
    setSearchResults(products);
    setSelectedProducts([]);
    onClearSelectedCategory();
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
          // options={searchResults}
          options={selectedCategoryId ? searchResults : products}
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
          Limpiar Filtros
        </Button>
      </Box>
      {/* Tabla de productos */}
      <Box sx={{ height: 450, mt: 2 }}>
        {/* <DataGrid
          rows={selectedProducts.length > 0 ? selectedProducts : searchResults}
          columns={columns}
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
          initialState={{
            pagination: {
              paginationModel: { page: 1, pageSize: 5 },
            },
            sorting: {
              sortModel: [{ field: 'name', sort: 'asc' }],
            }
          }}
          // onStateChange={(state) => {
          //   // TODO: Revisar si este método puede ser útil
          //   console.log('ON STATE CHANGE: ', state);
          // }}
          pageSizeOptions={[2, 5, 7, 9, 15]}
        /> */}
        <DataGrid
          rows={selectedProducts.length > 0 ? selectedProducts : searchResults}
          columns={columns}
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
          initialState={{
            pagination: {
              paginationModel: { page: 1, pageSize: 5 },
            },
            sorting: {
              sortModel: [{ field: 'name', sort: 'asc' }],
            }
          }}
          // onStateChange={(state) => {
          //   // TODO: Revisar si este método puede ser útil
          //   console.log('ON STATE CHANGE: ', state);
          // }}
          pageSizeOptions={[2, 5, 7, 9, 15]}
        />
      </Box>
    </Box>
  );
};
