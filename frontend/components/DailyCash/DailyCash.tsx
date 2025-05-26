// CajaDiariaApp.tsx con historial implementado
import React, { useState } from "react";
import {
  AppBar,
  Tabs,
  Tab,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from "@mui/material";

function TabPanel(props: any) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

export default function CajaDiariaApp() {
  const [tabIndex, setTabIndex] = useState(1);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nuevoMovimiento, setNuevoMovimiento] = useState({ tipo: "ingreso", metodo: "efectivo", monto: "", descripcion: "" });
  const [historialCajas, setHistorialCajas] = useState<any[]>([{
    fecha: "2025-05-25",
    apertura: 10000,
    cierre: 15200,
    ingresos: 7000,
    egresos: 1800,
    responsable: "Lucía"
  }, {
    fecha: "2025-05-24",
    apertura: 8000,
    cierre: 11000,
    ingresos: 4000,
    egresos: 1300,
    responsable: "Martín"
  }]);

  const handleAddMovimiento = () => {
    setMovimientos([...movimientos, { ...nuevoMovimiento, fecha: new Date().toLocaleTimeString() }]);
    setDialogOpen(false);
    setNuevoMovimiento({ tipo: "ingreso", metodo: "efectivo", monto: "", descripcion: "" });
  };

  return (
    <Box p={3}>
      <Card variant="outlined">
        <CardHeader title="Módulo de Caja Diaria" />
      </Card>

      <AppBar position="static" color="default" sx={{ mt: 2 }}>
        <Tabs
          value={tabIndex}
          onChange={(e, newValue) => setTabIndex(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Apertura" />
          <Tab label="Movimientos" />
          <Tab label="Cierre" />
          <Tab label="Historial" />
        </Tabs>
      </AppBar>

      <TabPanel value={tabIndex} index={0}>
        <Card>
          <CardContent>
            <TextField fullWidth label="Monto inicial en efectivo" type="number" margin="normal" />
            <TextField fullWidth label="Comentario (opcional)" margin="normal" />
            <Button variant="contained" color="primary">Abrir Caja</Button>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabIndex} index={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Movimientos</Typography>
          <Button variant="outlined" onClick={() => setDialogOpen(true)}>➕ Nuevo Movimiento</Button>
        </Box>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Hora</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Método</TableCell>
                <TableCell>Monto</TableCell>
                <TableCell>Descripción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movimientos.map((mov, i) => (
                <TableRow key={i}>
                  <TableCell>{mov.fecha}</TableCell>
                  <TableCell>{mov.tipo}</TableCell>
                  <TableCell>{mov.metodo}</TableCell>
                  <TableCell>${mov.monto}</TableCell>
                  <TableCell>{mov.descripcion}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>Nuevo Movimiento</DialogTitle>
          <DialogContent>
            <FormControl fullWidth margin="normal">
              <InputLabel>Tipo</InputLabel>
              <Select
                value={nuevoMovimiento.tipo}
                onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, tipo: e.target.value })}
              >
                <MenuItem value="ingreso">Ingreso</MenuItem>
                <MenuItem value="egreso">Egreso</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Método</InputLabel>
              <Select
                value={nuevoMovimiento.metodo}
                onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, metodo: e.target.value })}
              >
                <MenuItem value="efectivo">Efectivo</MenuItem>
                <MenuItem value="tarjeta">Tarjeta</MenuItem>
                <MenuItem value="transferencia">Transferencia</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Monto"
              type="number"
              margin="normal"
              value={nuevoMovimiento.monto}
              onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, monto: e.target.value })}
            />
            <TextField
              fullWidth
              label="Descripción"
              margin="normal"
              value={nuevoMovimiento.descripcion}
              onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, descripcion: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleAddMovimiento}>Guardar</Button>
          </DialogActions>
        </Dialog>
      </TabPanel>

      <TabPanel value={tabIndex} index={2}>
        <Card>
          <CardContent>
            <TextField fullWidth label="Dinero contado en efectivo" type="number" margin="normal" />
            <TextField fullWidth label="Total en tarjetas y transferencias" type="number" margin="normal" />
            <TextField fullWidth label="Comentario (opcional)" margin="normal" />
            <Button variant="contained" color="secondary">Cerrar Caja</Button>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabIndex} index={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Historial de Cajas</Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Apertura</TableCell>
                    <TableCell>Cierre</TableCell>
                    <TableCell>Ingresos</TableCell>
                    <TableCell>Egresos</TableCell>
                    <TableCell>Responsable</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historialCajas.map((caja, i) => (
                    <TableRow key={i}>
                      <TableCell>{caja.fecha}</TableCell>
                      <TableCell>${caja.apertura}</TableCell>
                      <TableCell>${caja.cierre}</TableCell>
                      <TableCell>${caja.ingresos}</TableCell>
                      <TableCell>${caja.egresos}</TableCell>
                      <TableCell>{caja.responsable}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
}
