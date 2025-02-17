import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Box, Autocomplete, TextField } from "@mui/material";
import { esES } from "@mui/x-data-grid/locales/esES";
import { getProductsByCategory, searchProducts } from "@/api/products";
import { ProductTableProps } from "@/components/Interfaces/IProducts";
import { useProductStore } from "@/components/Hooks/useProductStore";
import { useProductos } from "@/components/Hooks/useProducts";

export const ProductTable: React.FC<ProductTableProps> = ({
  columns,
  onCreate,
  selectedCategoryId,
  onClearSelectedCategory,
}) => {
  const { products, setProducts } = useProductStore();
  const { fetchAndSetProducts } = useProductos();
  const [searchResults, setSearchResults] = useState(products); // Productos filtrados
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]); // Productos seleccionados
  const [searchTerm, setSearchTerm] = useState("");

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


  // búsqueda de productos con endpoint 
  const handleSearch = async (value: string) => {
    const searchTerm = value.trim();
    if (searchTerm.length > 0 && searchTerm !== searchTerm) {
      setSearchTerm(searchTerm);
      const results = await searchProducts(searchTerm, selectedCategoryId);
      setSearchResults(results);
    } else if (searchTerm.length === 0) {
      setSearchResults(products);
    }
  };


  // Manejar selección de un producto
  const handleSelectProduct = (product: any) => {
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
    setSearchTerm("");
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
          options={selectedCategoryId ? searchResults : products}
          getOptionLabel={(product) =>
            `${product.name} - (Código: ${product.code})`
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
              {`${product.name} - (Código: ${product.code})`}
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
          pageSizeOptions={[2, 5, 7, 9, 15]}
        />
      </Box>
    </Box>
  );
};
