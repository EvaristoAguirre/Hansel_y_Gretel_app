import { Box, Typography, Card, CardContent, TextField, Autocomplete } from "@mui/material";
import { esES } from "@mui/x-data-grid/locales/esES";
import { DataGrid } from "@mui/x-data-grid";
import { useProductos } from "../../Hooks/useProducts";

const ingredientes = [
  { id: 1, nombre: "Leche", stock: "2 L", costo: "$100,00" },
  { id: 2, nombre: "Harina", stock: "20 Kg", costo: "$100,00" },
];

const costos = ["Costo total productos", "Costo total ingredientes", "Costo total"];

export default function StockControl() {
  const { products } = useProductos();

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
    <Box width="100%" sx={{ p: 2, height: "100%" }}>
      {/* Sección de Costos */}
      <Box display="flex" justifyContent="space-between" gap={2}>
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
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Autocomplete
          sx={{ width: "50%" }}
          options={products}
          getOptionLabel={(option) => option.name || ""}
          renderInput={(params) => (
            <TextField {...params} label="Buscar productos por nombre o código" variant="outlined" fullWidth />
          )}
        />
      </Box>

      {/* DataGrids */}
      <Box display="flex" gap={2} sx={{ mt: 3 }}>

        {/* DataGrid de Productos */}
        <Box flex={1}>
          <Typography variant="h6" align="center" sx={{ mb: 1, bgcolor: "#856d5e59", p: 1 }}>
            PRODUCTOS
          </Typography>
          <DataGrid
            rows={products}
            columns={productColumns}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            initialState={{
              pagination: { paginationModel: { page: 1, pageSize: 5 } },
              sorting: { sortModel: [{ field: "name", sort: "asc" }] },
            }}
            pageSizeOptions={[5, 7, 10]}
            sx={{ height: "100%" }}
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
          />
        </Box>
      </Box>
    </Box>
  );
}
