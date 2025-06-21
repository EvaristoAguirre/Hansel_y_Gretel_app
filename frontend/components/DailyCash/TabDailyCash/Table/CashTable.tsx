import { fetchAllDailyCash } from "@/api/dailyCash";
import { useAuth } from "@/app/context/authContext";
import { dailyCashModalType, dailyCashState } from "@/components/Enums/dailyCash";
import { I_DC_ } from "@/components/Interfaces/IDailyCash";
import { IRowData } from "@/components/Interfaces/IGridMUI";
import DataGridComponent from "@/components/Utils/DataGridComponent";
import { IconButton, Tooltip } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import CashDetailModal from "./CashDetailModal";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import { Box } from "@mui/system";
import CashModal from "../Open_CloseDailyCash/CashModal";



const CashTable = () => {
  const { getAccessToken } = useAuth();
  const token = getAccessToken();

  const [dataCashTable, setDataCashTable] = useState<IRowData[]>([]);
  const [selectedCash, setSelectedCash] = useState<I_DC_ | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [open, setOpen] = useState(false);



  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const data = token && await fetchAllDailyCash(token);
        if (data) setDataCashTable(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, [token]);

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
                  setSelectedCash(params.row);
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
                    onClick={() => setOpen(true)}
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
  return (
    <>
      <DataGridComponent
        rows={dataCashTable}
        columns={columns}
        capitalize={[]}
      />

      <CashDetailModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        data={selectedCash}
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
