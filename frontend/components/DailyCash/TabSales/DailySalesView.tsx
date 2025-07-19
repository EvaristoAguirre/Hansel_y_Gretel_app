import {
  Box,
  Button,
  Typography,
  Grid,
  Tooltip,
  IconButton,
  Table,
  TableBody,
  TableRow,
  TableCell,
  DialogActions,
  DialogContent,
  DialogTitle,
  Dialog,
} from "@mui/material";
import { useEffect, useState } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { getMovements, getMovementsDetailsById, getOrderDetails } from "@/api/dailyCash";
import { useAuth } from "@/app/context/authContext";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CashMovementDetailModal from "./CashMovementDetailModal";
import OrderDetailModal from "./OrderDetailModal";
import { MovementCash, OrderCash } from "@/components/Interfaces/IDailyCash";





const DailySalesView = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());


  const [dataOrders, setDataOrders] = useState<OrderCash[] | null>(null);
  const [dataMovements, setDataMovements] = useState<MovementCash[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { getAccessToken } = useAuth();
  const token = getAccessToken();

  const [openModal, setOpenModal] = useState(false);
  const [selectedMovementDetails, setSelectedMovementDetails] = useState<MovementCash | null>(null);


  const [openOrderModal, setOpenOrderModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderCash | null>(null);


  useEffect(() => {
    if (token) {
      handleSearch();
    }
  }, [token]);

  const handleOpenOrderDetail = async (orderId: string) => {
    try {
      const detail = token && await getOrderDetails(token, orderId);
      setSelectedOrderDetails(detail);
      setOpenOrderModal(true);
    } catch (error) {
      console.error("Error al obtener detalle de orden", error);
    }
  };


  const handleOpenDetail = async (movementId: string) => {
    try {
      const detail = token && await getMovementsDetailsById(token, movementId);
      setSelectedMovementDetails(detail);
      setOpenModal(true);
    } catch (error) {
      console.error("Error al obtener detalle del movimiento", error);
    }
  };

  const handleSearch = async () => {

    if (!selectedDate) return;

    setLoading(true);
    setError(null);
    setDataOrders(null);
    setDataMovements(null);

    try {
      const day = selectedDate.date();
      const month = selectedDate.month() + 1;
      const year = selectedDate.year();

      const result = token && await getMovements(token, day, month, year);

      if (!result || !result.date) {
        throw new Error("No se encontraron ventas para esa fecha.");
      }

      setDataOrders(result.orders);
      setDataMovements(result.movements);
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
      renderCell: (params) => dayjs(params.value).format("HH:mm"),
    },
    {
      field: "total",
      headerName: "Total",
      flex: 1,
      renderCell: (params) => (
        <span style={{ color: "green" }}>
          <>$ {params.value}</>
        </span>
      ),
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
          <IconButton
            size="small"
            onClick={() => handleOpenOrderDetail(params.row.id)}
          >
            <VisibilityIcon fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const movementColumns: GridColDef[] = [
    {
      field: "createdAt",
      headerName: "Hora",
      flex: 1,
      renderCell: (params) => dayjs(params.value).format("HH:mm"),
    },
    {
      field: "type",
      headerName: "Tipo",
      flex: 1,
      renderCell: (params) => (
        <span style={{ textTransform: "capitalize" }}>{params.value}</span>
      ),
    },
    {
      field: "amount",
      headerName: "Total",
      flex: 1,
      renderCell: (params) => {
        const isIngreso = params.row.type === "ingreso";
        return (
          <span style={{ color: isIngreso ? "green" : "red" }}>
            <>$ {params.value}</>
          </span>
        );
      },
    },

    {
      field: "verDetalle",
      headerName: "Detalle",
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="Ver detalle">
          <IconButton
            size="small"
            onClick={() => handleOpenDetail(params.row.id)}
          >
            <VisibilityIcon fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];






  return (
    <>
      <Grid container spacing={2} alignItems="center" mt={2}>
        <Grid item xs={12} sm={2} m={2}>
          <DatePicker
            label="Seleccionar fecha"
            value={selectedDate}
            onChange={setSelectedDate}
            format="DD/MM/YYYY"
            disableFuture
            sx={{
              animation: !selectedDate ? "pulse 1.2s infinite" : "none",
              "@keyframes pulse": {
                "0%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.05)" },
                "100%": { transform: "scale(1)" },
              },
            }}
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
      <Box p={1}>
        <Typography variant="h4" color="primary" gutterBottom>
          Ventas por Día
        </Typography>
        <Box
          bgcolor="#fff"
          borderRadius={2}
          boxShadow={1}
          mt={3}
        >
          <DataGrid
            rows={dataOrders?.map((order: any, i: number) => ({
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
      </Box>
      <Box p={1}>
        <Typography variant="h4" color="primary" gutterBottom>
          Movimientos por Día
        </Typography>
        {error && (
          <Typography color="error" mt={3}>
            {error}
          </Typography>
        )}

        <Box
          bgcolor="#fff"
          borderRadius={2}
          boxShadow={1}
          mt={3}
        >
          <DataGrid
            rows={dataMovements ?? []}
            columns={movementColumns}
            autoHeight
            pageSizeOptions={[5, 10]}
            localeText={{
              noRowsLabel: "No hay movimientos registrados",
            }}
            disableColumnMenu
          />


        </Box>


      </Box>
      <CashMovementDetailModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        movementDetails={selectedMovementDetails}
      />
      <OrderDetailModal
        open={openOrderModal}
        onClose={() => setOpenOrderModal(false)}
        orderDetails={selectedOrderDetails}
      />
    </>
  );
};

export default DailySalesView;
