import React, { useState, useEffect } from "react";
import { Button, Box } from "@mui/material";
import { getProductsByCategory, searchProducts } from "@/api/products";
import { ProductCreated, ProductTableProps } from "@/components/Interfaces/IProducts";
import { useProductStore } from "@/components/Hooks/useProductStore";
import { useProductos } from "@/components/Hooks/useProducts";
import AutoCompleteProduct from "@/components/Utils/Autocomplete";
import DataGridComponent from '../../Utils/ProductTable';

export const ProductTable: React.FC<ProductTableProps> = ({
  columns,
  onCreate,
  selectedCategoryId,
  onClearSelectedCategory,
}) => {
  const { products, setProducts } = useProductStore();
  const { fetchAndSetProducts } = useProductos();
  const [searchResults, setSearchResults] = useState(products); // Productos filtrados
  const [selectedProducts, setSelectedProducts] = useState<ProductCreated[]>([]); // Productos seleccionados
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
        <AutoCompleteProduct
          options={selectedCategoryId ? searchResults : products}
          onSearch={handleSearch}
          onSelect={handleSelectProduct}
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
      <DataGridComponent rows={selectedProducts.length > 0 ? selectedProducts : searchResults} columns={columns} />
    </Box>
  );
};
