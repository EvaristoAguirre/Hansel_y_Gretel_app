'use client';
import { Box, Button, Typography } from "@mui/material";
import { esES } from "@mui/x-data-grid/locales/esES";
import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import { useProductStore } from "@/components/Hooks/useProductStore";
import { useAuth } from "@/app/context/authContext";
import ModalStock from "./ModalStock";
import { StockModalType, TypeProduct } from "@/components/Enums/view-products";
import FilterStock from "./filterStock";
import { capitalizeFirstLetterTable } from "@/components/Utils/CapitalizeFirstLetter";
import { SelectedItem } from "@/components/Interfaces/IStock";
import { useIngredientsContext } from "@/app/context/ingredientsContext";
import { exportPDF, printStock } from "@/api/exportPDF";
import { Print, SimCardDownload } from "@mui/icons-material";
import { ProductResponse } from '../../Interfaces/IProducts';
import { formatNumber } from "@/components/Utils/FormatNumber";
import { normalizeNumber } from '../../Utils/NormalizeNumber';


const StockControl = () => {
  const { products, connectWebSocket } = useProductStore();
  const { getAccessToken } = useAuth();
  const [productsSimple, setProductsSimple] = useState<ProductResponse[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductResponse[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [noStock, setNoStock] = useState(false);

  const { ingredientsAndToppings } = useIngredientsContext();

  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);


  useEffect(() => {
    setProductsSimple(products.filter((product) => product.type === TypeProduct.SIMPLE));
  }, [products]);

  // Actualizar los productos seleccionados al cambiar `products`
  useEffect(() => {
    const updatedSelectedProducts = selectedProducts.map((selectedProduct) =>
      productsSimple.find((product) => product.id === selectedProduct.id) || selectedProduct
    );
    setSelectedProducts(updatedSelectedProducts);
  }, [productsSimple]);


  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    setToken(token);
  }, []);


  const formattedProducts = productsSimple.map((product) => ({
    id: product.id,
    name: product.name,
    stock: product.stock?.quantityInStock || null,
    unit: product.stock?.unitOfMeasure?.name || null,
    min: product.stock?.minimumStock,
    cost: product.cost || null,
    idStock: product.stock?.id || null
  }));

  const formattedIngredients = ingredientsAndToppings.map((ingredient) => ({
    id: ingredient.id,
    name: ingredient.name,
    stock: ingredient.stock?.quantityInStock || null,
    unit: ingredient.stock?.unitOfMeasure?.name || null,
    min: ingredient.stock?.minimumStock || null,
    cost: ingredient.cost || null,
    idStock: ingredient.stock?.id || null
  }));

  //Edición de Producto
  const handleEditProduct = (item: any, type: StockModalType) => {
    setSelectedItem({ ...item, type });
    setModalOpen(true);
  };
  const getColorByStock = (stock: string, min: string) => {

    const stockNumber = normalizeNumber(stock);
    const minNumber = normalizeNumber(min);
    if (stockNumber <= (minNumber / 2)) {
      return "#d94d22";
    } else if (stockNumber <= minNumber) {
      return "#f9b32d";
    } else if (stockNumber > minNumber) {
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
    {
      field: "cost", headerName: "Costo", flex: 1,
      renderCell: (params: any) =>
        <>$ {params.value}</>
    },
  ];


  const ingredientColumns = [
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
                width: "10px",
                height: "50px",
                backgroundColor: bgColor,
                borderRadius: "4px",
                marginRight: "8px",
              }}
            />
            {/* Valor de stock */}
            <Typography>{stock}</Typography>
          </Box>
        );
      }
    },
    { field: "name", headerName: "Nombre", flex: 1 },
    { field: "unit", headerName: "Unidad de Medida", flex: 1 },
    { field: "min", headerName: "Stock Minimo", flex: 1 },
    {
      field: "cost", headerName: "Costo", flex: 1,
      renderCell: (params: any) =>
        <>$ {params.value}</>
    },
  ];


  //limpiar el modal
  const handleCloseModal = () => {
    setSelectedItem(null);
    setModalOpen(false);
  };

  const [selectedStockFilter, setSelectedStockFilter] = useState<string | null>(null);

  const filterByStock = (items: SelectedItem[]) => {

    return items.filter((item: SelectedItem) => {
      const stockQuantity = normalizeNumber(item.stock);
      const minStock = normalizeNumber(item.min);


      if (!selectedStockFilter) return true;
      if (selectedStockFilter === 'low') return stockQuantity <= minStock / 2;
      if (selectedStockFilter === 'medium') return stockQuantity > minStock / 2 && stockQuantity <= minStock;
      if (selectedStockFilter === 'high') return stockQuantity > minStock;

      return true;
    });
  };


  const filteredProducts = filterByStock(formattedProducts);
  const filteredIngredients = filterByStock(formattedIngredients);

  useEffect(() => {
    const hasNullStock = filteredProducts.some((product) =>
      product.stock === null || product.stock === undefined || product.stock === "0"
    );
    const hasNullStockIngredients = filteredIngredients.some((ingredient) =>
      ingredient.stock === null || ingredient.stock === undefined || ingredient.stock === "0"
    );

    if (hasNullStock || hasNullStockIngredients) {
      setNoStock(true);
    } else {
      setNoStock(false);
    }
  }, [filteredProducts, filteredIngredients]);

  const handleExportPDF = () => {
    token && exportPDF(token);
  }

  const handlePrintStock = () => {
    token && printStock(token);
  }

  return (
    <Box width="100%" sx={{ p: 2, minHeight: "100vh" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", mb: 2 }}>
        <FilterStock currentFilter={selectedStockFilter} onFilterChange={setSelectedStockFilter} />
        <Box
          sx={{ gap: 2, display: "flex", flexWrap: "wrap", justifyContent: "flex-end" }}
        >
          <Button
            variant="contained"
            color="secondary"
            startIcon={<SimCardDownload />}
            onClick={handleExportPDF}
            sx={{
              mt: { xs: 2, sm: 0 },
              "&:hover": {
                color: "white",
                backgroundColor: "#856d5e",
              }
            }}

          >
            Exportar Stock (PDF)
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Print />}
            onClick={handlePrintStock}
            sx={{
              mt: { xs: 2, sm: 0 },
              "&:hover": {
                color: "white",
                backgroundColor: "#856d5e",
              }
            }}
          >
            Imprimir Stock (Comandera)
          </Button>
        </Box>
      </Box>
      {noStock && (
        <Typography variant="h6" sx={{ mt: 2 }} color="error">
          ❗️Hay productos o ingredientes sin stock asignado.
          Seleccione la fila correspondiente en la tabla para agregar stock.
        </Typography>
      )}

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
            sx={{
              height: "100%",
              "& .MuiDataGrid-row": {
                cursor: "pointer",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "#f3d49a66",
              },
            }}
            onRowClick={(params) => handleEditProduct(params.row, StockModalType.PRODUCT)}
          />
        </Box>

        {/* DataGrid de Ingredientes */}
        <Box flex={1}>
          <Typography variant="h6" align="center" sx={{ mb: 1, bgcolor: "#f3d49a66", p: 1 }}>
            INGREDIENTES
          </Typography>
          <DataGrid
            rows={filteredIngredients}
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
            onSave={handleCloseModal}
          />
        )
      }
    </Box >
  );
}
export default StockControl;