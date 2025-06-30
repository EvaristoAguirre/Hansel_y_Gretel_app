import { dailyCashModalType, dailyCashState } from "@/components/Enums/dailyCash";
import { IDailyCash } from "@/components/Interfaces/IDailyCash";
import DataGridComponent from "@/components/Utils/DataGridComponent";
import { IconButton, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import CashDetailModal from "./CashDetailModal";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import { Box } from "@mui/system";
import { useDailyCash } from "@/app/context/dailyCashContext";
import CashModal from "../Open_CloseDailyCash/CashModal";
import { esES } from "@mui/x-data-grid/locales";
import CashFilters from "./CashFilters";




const CashTable = () => {
  const [selectedDailyCash, setSelectedDailyCash] = useState<IDailyCash | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [open, setOpen] = useState(false);


  const { allDailyCash, dailyCashSummary, fetchAllCash, selectedCash, fetchCashSummary } = useDailyCash();

  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());


  useEffect(() => {
    fetchAllCash();
    fetchCashSummary();
  }, []);

  const columsCash: GridColDef[] = [
    { field: "date", headerName: "Fecha", flex: 1 },
    { field: "incomes", headerName: "Ingresos", flex: 1 },
    { field: "expenses", headerName: "Egresos", flex: 1 },
  ];

  const columns: GridColDef[] = [
    {
      field: "date",
      headerName: "Fecha",
      flex: 1,
      renderCell: (params: any) => {
        return new Date(params.value).toLocaleDateString("es-AR");
      }
    },
    {
      field: "totalSales",
      headerName: "Ingresos",
      flex: 1,
      renderCell: (params) => (
        <span style={{ color: "green" }}>
          ${Number(params.value).toFixed(2)}
        </span>
      )
    },
    {
      field: "totalPayments",
      headerName: "Egresos",
      flex: 1,
      renderCell: (params) => <span style={{ color: "red" }}> ${Number(params.value).toFixed(2)}</span>,
    },
    {
      field: "state",
      headerName: "Estado de Caja",
      flex: 1,
      renderCell: (params) => {
        const estadoTraducido = params.value === dailyCashState.OPEN ? "Abierta" : "Cerrada";
        const bgColor = params.value === dailyCashState.OPEN ? "#d0f0c0" : "#f5f5f5";

        return (
          <span
            style={{
              backgroundColor: bgColor,
              padding: "4px 8px",
              borderRadius: 4,
              fontWeight: 500,
            }}
          >
            {estadoTraducido}
          </span>
        );
      },
    },
    {
      field: "acciones",
      headerName: "Acciones",
      flex: 1,
      sortable: false,
      renderCell: (params) => {
        const state = params.row.state;

        return (
          <Box display="flex" gap={1}>
            <Tooltip title="Ver">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedDailyCash(params.row);
                  setOpenModal(true);
                }}
              >
                <VisibilityIcon fontSize="small" color="primary" />
              </IconButton>
            </Tooltip>

            {state === "open" && (
              <>
                <Tooltip title="Editar">
                  <IconButton
                    size="small"
                    onClick={() => {
                      console.log("Editar caja:", params.row.id);
                    }}
                  >
                    <EditIcon fontSize="small" color="primary" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Cerrar caja">
                  <IconButton
                    size="small"
                    onClick={() => {
                      selectedCash(params.row.id);
                      setOpen(true)
                    }}
                  >
                    <LockIcon fontSize="small" color="primary" />
                  </IconButton>
                </Tooltip>
              </>
            )}

            <Tooltip title="Eliminar">
              <IconButton
                size="small"
                onClick={() => {
                  console.log("Eliminar caja:", params.row.id);
                }}
              >
                <DeleteIcon fontSize="small" color="primary" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    }

  ];

  const filteredCash = allDailyCash.filter((cash) => {
    if (!cash.date) return false;
    const date = new Date(cash.date);
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  });

  return (
    <>
      {dailyCashSummary?.result === 'no hay resumen disponible' ? (
        <Box textAlign="center" mt={2} mb={4}>
          <strong style={{ fontSize: 16, color: "#555" }}>
            No hay resumen disponible para la caja del día.
          </strong>
        </Box>
      ) : (
        <>
          <Typography variant="h6" gutterBottom textAlign="start">
            Resumen Parcial de la Caja del Día
          </Typography>
          <Box
            bgcolor="#fff"
            borderRadius={2}
            boxShadow={1}
            maxWidth={500}

          >

            <DataGrid
              rows={[
                {
                  id: 1,
                  incomes: dailyCashSummary?.incomes ?? 0,
                  expenses: dailyCashSummary?.expenses ?? 0,
                },
              ]}
              columns={[
                {
                  field: "incomes",
                  headerName: "Ingresos",
                  flex: 1,
                  renderCell: (params) => (
                    <span style={{ color: "green" }}>
                      $
                      {new Intl.NumberFormat("es-AR", {
                        minimumFractionDigits: 2,
                      }).format(params.value)}
                    </span>
                  ),
                },
                {
                  field: "expenses",
                  headerName: "Egresos",
                  flex: 1,
                  renderCell: (params) => (
                    <span style={{ color: "red" }}>
                      $
                      {new Intl.NumberFormat("es-AR", {
                        minimumFractionDigits: 2,
                      }).format(params.value)}
                    </span>
                  ),
                },
              ]}
              autoHeight
              hideFooter
              disableColumnMenu
              localeText={esES.components.MuiDataGrid.defaultProps.localeText}
              sx={{
                backgroundColor: "#fff",
                border: "none",
              }}
            />
          </Box>
        </>
      )}


      <CashFilters month={month} year={year} setMonth={setMonth} setYear={setYear} />

      <DataGridComponent
        rows={filteredCash}
        columns={columns}
        capitalize={[]}
      />


      <CashDetailModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        data={selectedDailyCash}
      />

      <CashModal
        open={open}
        onClose={() => setOpen(false)}
        type={dailyCashModalType.CLOSE}
      />
    </>

  );
};

export default CashTable;
