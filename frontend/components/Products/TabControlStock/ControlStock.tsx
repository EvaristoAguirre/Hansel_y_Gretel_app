'use client';
import { Box, Typography, Card, CardContent, TextField, Autocomplete, Button } from "@mui/material";
import { esES } from "@mui/x-data-grid/locales/esES";
import { DataGrid } from "@mui/x-data-grid";
import { useProductos } from "../../Hooks/useProducts";
import { ProductCreated, ProductsProps } from "@/components/Interfaces/IProducts";
import { useEffect, useState } from "react";
import { useProductStore } from "@/components/Hooks/useProductStore";
import { searchProducts } from "@/api/products";
import { useAuth } from "@/app/context/authContext";
import { Iingredient } from "@/components/Interfaces/Ingredients";
import { fetchIngredients } from "@/api/ingredients";
import ModalStock from "./ModalStock";
import { StockModalType } from "@/components/Enums/view-products";
import FilterStock from "./filterStock";
import { capitalizeFirstLetterTable } from "@/components/Utils/CapitalizeFirstLetter";



const costos = ["Costo total productos", "Costo total ingredientes", "Costo total"];

const StockControl: React.FC<ProductsProps> = ({ selectedCategoryId, onClearSelectedCategory }) => {
  const { products, connectWebSocket } = useProductStore();
  const { getAccessToken } = useAuth();
  const [searchResults, setSearchResults] = useState(products); // Productos filtrados
  const [selectedProducts, setSelectedProducts] = useState<ProductCreated[]>([]); // Productos seleccionados
  const [searchTerm, setSearchTerm] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<Iingredient[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);


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
  }, []);


  useEffect(() => {
    if (token) {
      fetchIngredients(token).then((data) => {
        setIngredients(data);
        console.log(data);
      });
    }

  }, [token]);

  const formattedProducts = (selectedProducts.length > 0 ? selectedProducts : searchResults).map((product) => ({
    id: product.id,
    name: product.name,
    stock: product.stock?.quantityInStock || null,
    unit: product.stock?.unitOfMeasure?.name || null,
    min: product.stock?.minimumStock || null,
    cost: product.cost || null,
  }));


  // Manejar búsqueda de productos
  const handleSearch = async (value: string) => {
    const searchTerm = value.trim();
    if (searchTerm.length > 0 && searchTerm !== searchTerm) {
      setSearchTerm(searchTerm);
      if (token && selectedCategoryId) {
        const results = await searchProducts(searchTerm, selectedCategoryId, token);
        setSearchResults(results);
      }
    } else if (searchTerm.length === 0) {
      setSearchResults(products);
    }
  };

  // Manejar selección de un producto
  const handleSelectProduct = (product: ProductCreated) => {
    if (!selectedProducts.find((p) => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
    }
    else {
      setSelectedProducts(selectedProducts.filter((p) => p.id !== product.id));
    };
  };

  // Limpiar búsqueda y mostrar todos los productos
  const handleClearSearch = () => {
    setSearchResults(products);
    setSelectedProducts([]);
    onClearSelectedCategory();
  };

  //Edición de Producto
  const handleEditProduct = (item: any, type: StockModalType) => {
    //llamamos a product para que se actualice la tabla
    setSelectedItem({ ...item, type });
    setModalOpen(true);
  };
  const getColorByStock = (stock: number, min: number) => {
    if (stock <= (min / 2)) {
      return "#d94d22";
    } else if (stock <= min) {
      return "#f9b32d";
    } else if (stock > min) {
      return "#21b421";
    }
    return "";
  };


  const productColumns = [
    {
      field: "stock",
      headerName: "Stock",
      flex: 1,
      renderCell: (params: any) => {
        const stock = params.row.stock;
        const min = params.row.min;
        const bgColor = getColorByStock(stock, min);
        return (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/* Etiqueta de color*/}
            <Box
              sx={{
                width: "10px",
                height: "50px",
                backgroundColor: bgColor,
                borderRadius: "4px",
                marginRight: "8px",
              }}
            />
            <Typography>{stock}</Typography>
          </Box>
        );
      }
    },
    { field: "name", headerName: "Nombre", flex: 1 },
    { field: "unit", headerName: "Unidad de Medida", flex: 1 },
    { field: "min", headerName: "Stock Minimo", flex: 1 },
    { field: "cost", headerName: "Costo", flex: 1 },
  ];


  const ingredientColumns = [
    { field: "name", headerName: "Nombre", flex: 1 },
    {
      field: "stock",
      headerName: "Stock",
      flex: 1,
      renderCell: (params: any) => {
        const stock = params.row.stock;
        const min = params.row.min;
        const bgColor = getColorByStock(stock, min);
        return (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/* Etiqueta de color a la izquierda */}
            <Box
              sx={{
                width: "8px", // Grosor de la etiqueta
                height: "16px", // Altura
                backgroundColor: bgColor,
                borderRadius: "4px",
                marginRight: "8px", // Espacio entre la etiqueta y el número
              }}
            />
            {/* Valor de stock */}
            <Typography>{stock}</Typography>
          </Box>
        );
      }
    },
    { field: "unit", headerName: "Unidad de Medida", flex: 1 },
    { field: "min", headerName: "Stock Minimo", flex: 1 },
    { field: "cost", headerName: "Costo", flex: 1 },
  ];


  //limpiar el modal
  const handleCloseModal = () => {
    setSelectedItem(null);
    setModalOpen(false);
  };

  const [selectedStockFilter, setSelectedStockFilter] = useState(null);

  const filterByStock = (items) => {
    return items.filter((item) => {
      const stockQuantity = item.stock
      const minStock = item.min

      if (!selectedStockFilter) return true;
      if (selectedStockFilter === 'low') return stockQuantity <= minStock / 2;
      if (selectedStockFilter === 'medium') return stockQuantity > minStock / 2 && stockQuantity <= minStock;
      if (selectedStockFilter === 'high') return stockQuantity > minStock;

      return true;
    });
  };


  const filteredProducts = filterByStock(formattedProducts);
  // const filteredIngredients = filterByStock(ingredients);


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

      {/* Buscador de productos
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 2 }}>
        {/* Buscador de productos */}
      {/* <Autocomplete
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
    </Box>  */}


      <FilterStock currentFilter={selectedStockFilter} onFilterChange={setSelectedStockFilter} />

      {/* DataGrids */}
      <Box display="flex" gap={2} sx={{ mt: 3 }}>

        {/* DataGrid de Productos */}
        <Box flex={1}>
          <Typography variant="h6" align="center" sx={{ mb: 1, bgcolor: "#856d5e59", p: 1 }}>
            PRODUCTOS
          </Typography>
          <DataGrid
            rows={capitalizeFirstLetterTable(filteredProducts, ['name'])}
            columns={productColumns}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            initialState={{
              pagination: { paginationModel: { page: 1, pageSize: 5 } },
              sorting: { sortModel: [{ field: "name", sort: "asc" }] },
            }}
            pageSizeOptions={[5, 7, 10]}
            sx={{ height: "100%" }}
            onRowClick={(params) => handleEditProduct(params.row, StockModalType.PRODUCT)}
          />
        </Box>

        {/* DataGrid de Ingredientes */}
        <Box flex={1}>
          <Typography variant="h6" align="center" sx={{ mb: 1, bgcolor: "#f3d49a66", p: 1 }}>
            INGREDIENTES
          </Typography>
          <DataGrid
            rows={ingredients}
            columns={ingredientColumns}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            initialState={{
              pagination: { paginationModel: { page: 1, pageSize: 5 } },
              sorting: { sortModel: [{ field: "name", sort: "asc" }] },
            }}
            pageSizeOptions={[5, 7, 10]}
            sx={{ height: "100%" }}
            onRowClick={(params) => handleEditProduct(params.row, StockModalType.INGREDIENT)}
          />
        </Box>
      </Box>
      {/* Modal para agregar stock */}
      {
        selectedItem && (
          <ModalStock
            open={modalOpen}
            selectedItem={selectedItem}
            token={token}
            onClose={() => setModalOpen(false)}
            onSave={() => { handleCloseModal }}
          />
        )
      }
    </Box >
  );
}
export default StockControl;