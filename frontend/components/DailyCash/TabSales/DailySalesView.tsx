import {
  Box,
  Button,
  Typography,
  Grid,
  Tooltip,
  IconButton,
} from "@mui/material";
import { useState } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { getMovements } from "@/api/dailyCash";
import { useAuth } from "@/app/context/authContext";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";



type Order = {
  id: string;
  date: string;
  total: string;
  methodOfPayment: string;
  numberCustomers: number;
};

type DailyCashData = {
  date: string;
  totalSales: string;
  totalPayments: string;
  initialCash: string;
  finalCash: string;
  totalCash: string;
  cashDifference: string;
  totalCreditCard: string;
  totalDebitCard: string;
  totalTransfer: string;
  totalMercadoPago: string;
  orders: Order[];
};

const DailySalesView = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [data, setData] = useState<DailyCashData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { getAccessToken } = useAuth();
  const token = getAccessToken();
  const handleSearch = async () => {

    if (!selectedDate) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const day = selectedDate.date();
      const month = selectedDate.month() + 1; // en JS enero = 0
      const year = selectedDate.year();

      const result = token && await getMovements(token, day, month, year);

      if (!result || !result.date) {
        throw new Error("No se encontraron ventas para esa fecha.");
      }

      setData(result);
    } catch (err: any) {
      setError(err.message || "Error al obtener los datos.");
    } finally {
      setLoading(false);
    }
  };

  const orderColumns: GridColDef[] = [
    {
      field: "date",
      headerName: "Hora",
      flex: 1,
      renderCell: (params) =>
        dayjs(params.value).format("HH:mm")
    },
    {
      field: "total",
      headerName: "Total",
      flex: 1,
      renderCell: (params) => (
        <span style={{ color: "green" }}>
          ${Number(params.value).toFixed(2)}
        </span>
      ),
    },
    {
      field: "methodOfPayment",
      headerName: "Método de pago",
      flex: 1,
    },
    {
      field: "numberCustomers",
      headerName: "Clientes",
      flex: 1,
    },
    {
      field: "verDetalle",
      headerName: "Detalle de la orden",
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="Ver detalle">
          <IconButton size="small">
            <VisibilityIcon fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>
      ),
    },

  ];

  return (
    <Box p={1}>
      <Typography variant="h4" color="primary" gutterBottom>
        Ventas por Día
      </Typography>

      <Grid container spacing={2} alignItems="center" mt={2}>
        <Grid item xs={12} sm={2}>
          <DatePicker
            label="Seleccionar fecha"
            value={selectedDate}
            onChange={setSelectedDate}
            format="DD/MM/YYYY"
          />
        </Grid>
        <Grid item >
          <Button variant="contained" onClick={handleSearch} disabled={!selectedDate}
            sx={{ height: "52px", minWidth: "100px" }}
          >
            Buscar
          </Button>
        </Grid>
      </Grid>

      {error && (
        <Typography color="error" mt={3}>
          {error}
        </Typography>
      )}

      {data && (
        <>
          <Box
            bgcolor="#fff"
            borderRadius={2}
            boxShadow={1}
            mt={3}
          >
            <DataGrid
              rows={data.orders.map((order: any, i: number) => ({
                ...order,
                id: order.id || i,
              }))}
              columns={orderColumns}
              autoHeight
              pageSizeOptions={[5, 10]}
              localeText={{
                noRowsLabel: "No hay pedidos registrados",
              }}
              disableColumnMenu
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default DailySalesView;
