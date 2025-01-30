import { Box, Typography, TextField, Card, CardContent, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Autocomplete } from "@mui/material";

const stockData = {
  productos: [
    { nombre: "Soda", stock: "20 u.", costo: "$100,00", color: "#795548" },
    { nombre: "Coca-cola", stock: "20 u.", costo: "$100,00", color: "white" }
  ],
  ingredientes: [
    { nombre: "Leche", stock: "2 L", costo: "$100,00" },
    { nombre: "Harina", stock: "20 Kg", costo: "$100,00" }
  ]
};

const costos = ["Costo total productos", "Costo total ingredientes", "Costo total"];

export default function StockControl() {
  return (
    <Box width="100%" sx={{ p: 2 }}>
      <Grid container spacing={2}>
        {costos.map((text, index) => (
          <Grid item xs={4} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h5" align="center">$200</Typography>
                <Typography align="center">{text}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {/* Buscador de productos */}
      <Autocomplete
        sx={{ flexGrow: 1, width: '40%', marginRight: 2, marginTop: 4 }}
        // options={searchResults}
        options={[]}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Buscar productos por nombre o código"
            variant="outlined"
            fullWidth
          />
        )}
        renderOption={(option) => (
          <div></div>
        )}
      />
      <Grid container spacing={2} sx={{ mt: 3 }}>
        {/* Tabla de Productos */}
        <Grid item xs={6}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: "#856d5e21" }}>
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ bgcolor: "#856d5e59" }}><b>PRODUCTOS</b></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><b>Nombre</b></TableCell>
                  <TableCell><b>Stock</b></TableCell>
                  <TableCell><b>Costo</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stockData.productos.map((producto, index) => (
                  <TableRow key={index} >
                    <TableCell>{producto.nombre}</TableCell>
                    <TableCell>{producto.stock}</TableCell>
                    <TableCell>{producto.costo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Tabla de Ingredientes */}
        <Grid item xs={6}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead >
                <TableRow sx={{ bgcolor: "#f3d49ab8" }}>
                  <TableCell colSpan={3} align="center" ><b>INGREDIENTES</b></TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: "#f3d49a66" }}>
                  <TableCell><b>Nombre</b></TableCell>
                  <TableCell><b>Stock</b></TableCell>
                  <TableCell><b>Costo</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stockData.ingredientes.map((ingrediente, index) => (
                  <TableRow key={index}>
                    <TableCell>{ingrediente.nombre}</TableCell>
                    <TableCell>{ingrediente.stock}</TableCell>
                    <TableCell>{ingrediente.costo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
}
