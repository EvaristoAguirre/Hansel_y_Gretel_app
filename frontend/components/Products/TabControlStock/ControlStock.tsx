'use client';
import { Box, Typography, Card, CardContent, TextField, Autocomplete, Button } from "@mui/material";
import { esES } from "@mui/x-data-grid/locales/esES";
import { DataGrid } from "@mui/x-data-grid";
import { useProductos } from "../../Hooks/useProducts";
import { ProductsProps } from "@/components/Interfaces/IProducts";
import { useCategoryStore } from "@/components/Categories/useCategoryStore";
import { useEffect, useState } from "react";
import { useProductStore } from "@/components/Hooks/useProductStore";
import { getProductsByCategory, searchProducts } from "@/api/products";
import { useAuth } from "@/app/context/authContext";

const ingredientes = [
  { id: 1, nombre: "Leche", stock: "2 L", costo: "$100,00" },
  { id: 2, nombre: "Harina", stock: "20 Kg", costo: "$100,00" },
];

const costos = ["Costo total productos", "Costo total ingredientes", "Costo total"];

const StockControl: React.FC<ProductsProps> = ({ selectedCategoryId, onClearSelectedCategory }) => {
  const { products, setProducts, connectWebSocket } = useProductStore();
  const { getAccessToken } = useAuth();
  const [searchResults, setSearchResults] = useState(products); // Productos filtrados
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]); // Productos seleccionados
  const { categories } = useCategoryStore();
  const { fetchAndSetProducts } = useProductos();
  const [searchTerm, setSearchTerm] = useState("");
  const [token, setToken] = useState<string | null>(null);



  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

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
        const response = await getProductsByCategory(selectedCategoryId, token);

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
      fetchAndSetProducts(token);
    }
  }, [selectedCategoryId]);

  // Manejar búsqueda de productos
  const handleSearch = async (value: string) => {
    const searchTerm = value.trim();
    if (searchTerm.length > 0 && searchTerm !== searchTerm) {
      setSearchTerm(searchTerm);
      if (token) {
        const results = await searchProducts(searchTerm, selectedCategoryId, token);
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
    onClearSelectedCategory();
  };

  //Edición de Producto
  const handleEditProduct = (product: any) => {
  };

  const productColumns = [
    { field: "name", headerName: "Nombre", flex: 1 },
    { field: "price", headerName: "Stock", flex: 1 },
    { field: "cost", headerName: "Costo", flex: 1 },
  ];

  const ingredientColumns = [
    { field: "nombre", headerName: "Nombre", flex: 1 },
    { field: "stock", headerName: "Stock", flex: 1 },
    { field: "costo", headerName: "Costo", flex: 1 },
  ];

  return (
    <Box width="100%" sx={{ p: 2, minHeight: "100vh" }}>
      {/* Sección de Costos */}
      <Box display="flex" justifyContent="space-between" gap={2}  >
        {costos.map((text, index) => (
          <Card key={index} sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h5" align="center">$200</Typography>
              <Typography align="center">{text}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Buscador de productos */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 2 }}>
        {/* Buscador de productos */}
        <Autocomplete
          sx={{ width: '49%' }}
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
        <Button
          sx={{ flexGrow: 1, border: "2px solid #f9b32d", color: "black" }}
          variant="outlined"
          onClick={handleClearSearch}
        >
          Limpiar Filtros
        </Button>
      </Box>

      {/* DataGrids */}
      <Box display="flex" gap={2} sx={{ mt: 3 }}>

        {/* DataGrid de Productos */}
        <Box flex={1}>
          <Typography variant="h6" align="center" sx={{ mb: 1, bgcolor: "#856d5e59", p: 1 }}>
            PRODUCTOS
          </Typography>
          <DataGrid
            rows={selectedProducts.length > 0 ? selectedProducts : searchResults}
            columns={productColumns}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            initialState={{
              pagination: { paginationModel: { page: 1, pageSize: 5 } },
              sorting: { sortModel: [{ field: "name", sort: "asc" }] },
            }}
            pageSizeOptions={[5, 7, 10]}
            sx={{ height: "100%" }}
            onRowClick={(params) => handleEditProduct(params.row)}
          />
        </Box>

        {/* DataGrid de Ingredientes */}
        <Box flex={1}>
          <Typography variant="h6" align="center" sx={{ mb: 1, bgcolor: "#f3d49a66", p: 1 }}>
            INGREDIENTES
          </Typography>
          <DataGrid
            rows={ingredientes}
            columns={ingredientColumns}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            initialState={{
              pagination: { paginationModel: { page: 1, pageSize: 5 } },
              sorting: { sortModel: [{ field: "name", sort: "asc" }] },
            }}
            pageSizeOptions={[5, 7, 10]}
            sx={{ height: "100%" }}
            onRowClick={(params) => handleEditProduct(params.row)}
          />
        </Box>
      </Box>
    </Box>
  );
}
export default StockControl;