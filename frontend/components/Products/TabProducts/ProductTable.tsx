import React, { useState, useEffect } from "react";
import { Button, Box } from "@mui/material";
import { getProductsByCategory, searchProducts } from "@/api/products";
import { ProductResponse, ProductTableProps } from "@/components/Interfaces/IProducts";
import { useProductStore } from "@/components/Hooks/useProductStore";
import { useProducts } from "@/components/Hooks/useProducts";
import AutoCompleteProduct from "@/components/Utils/Autocomplete";
import DataGridComponent from '../../Utils/DataGridComponent';
import { useAuth } from "@/app/context/authContext";
import LoadingLottie from "@/components/Loader/Loading";
import { fetchCategories } from "@/api/categories";
import { ICategory } from "@/components/Interfaces/ICategories";

export const ProductTable: React.FC<ProductTableProps> = ({
  columns,
  loading,
  onCreate,
  onCreateSlot,
  selectedCategoryId,
  onClearSelectedCategory,
}) => {
  const { getAccessToken } = useAuth();
  const { products, setProducts } = useProductStore();
  const { fetchAndSetProducts } = useProducts();
  const [searchResults, setSearchResults] = useState(products); // Productos filtrados
  const [selectedProducts, setSelectedProducts] = useState<ProductResponse[]>([]); // Productos seleccionados
  const [searchTerm, setSearchTerm] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [categories, setCategories] = useState<ICategory[]>([]);

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
    const token = getAccessToken();
    if (!token) return;
    setToken(token);

    if (selectedCategoryId) {
      const fetchProductsByCategory = async () => {
        const data = await getProductsByCategory(selectedCategoryId, token);
        setProducts(data);
      };
      fetchProductsByCategory();
    } else {
      fetchAndSetProducts(token);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    token && fetchCategories(token).then((categories = []) => setCategories(categories));
  }, []);


  // búsqueda de productos con endpoint 
  const handleSearch = async (value: string, token: string) => {
    const searchTerm = value.trim();
    if (searchTerm.length > 0) {
      setSearchTerm(searchTerm);
      if (token) {
        const results = await searchProducts(searchTerm, selectedCategoryId!, token);
        setSearchResults(results);
      }
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
    token && fetchAndSetProducts(token);
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
          disabled={loading}
        >
          {loading ? <LoadingLottie /> : '+ Nuevo Producto'}
        </Button>

        <Button
          variant="contained"
          color="secondary"
          sx={{ marginRight: 2, width: '20%' }}
          onClick={onCreateSlot}
          disabled={loading}
        >
          {loading ? <LoadingLottie /> : '+ Nuevo Slot'}
        </Button>

        {/* Buscador de productos */}
        <div className="w-[60%] mr-3">
          <AutoCompleteProduct
            options={selectedCategoryId ? searchResults : products}
            onSearch={(value) => handleSearch(value, token!)}
            onSelect={handleSelectProduct}
          />
        </div>

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
      <DataGridComponent rows={selectedProducts.length > 0 ? selectedProducts : searchResults} columns={columns} capitalize={["name", "description"]} />
    </Box>
  );
};
