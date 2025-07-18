'use client'
import React, { useEffect, useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Button, ListItemText, Tooltip, Typography } from "@mui/material";
import { useRoomContext } from '@/app/context/room.context';
import { useAuth } from "@/app/context/authContext";
import { UserRole } from "../../Enums/user";
import { TableModalType } from "../../Enums/table";
import { ITable } from "../../Interfaces/ITable";
import PivotTableChartIcon from '@mui/icons-material/PivotTableChart';
import { transferOrder } from "@/api/order";
import { useOrderContext } from "@/app/context/order.context";
import TransferTableModal from "./ModalTranfer";
import Swal from "sweetalert2";
import { IOrderTranfer } from "@/components/Interfaces/IOrder";

interface TableCardProps {
  table: ITable;
  handleOpenModal: (type: TableModalType, table?: ITable) => void;
  handleDelete: (id: string) => void;
}
const TableCard: React.FC<TableCardProps> = ({
  table, handleOpenModal, handleDelete
}) => {
  const mesaColors = {
    available: "#21b421",
    open: "#d94d22",
    pending_payment: "#f9b32d",
    closed: "#1f7cad",
  };
  const { selectedRoom, handleSelectTable, selectedTable } = useRoomContext();
  const borderColor = (table && table.state) ? mesaColors[table.state] : mesaColors.closed;
  const { userRoleFromToken } = useAuth();
  const [role, setRole] = useState<string | null>(null);

  const { getAccessToken } = useAuth();
  const token = getAccessToken();


  const {
    selectedOrderByTable,
  } = useOrderContext();

  useEffect(() => {
    setRole(userRoleFromToken());
  }, []);

  const handleClickTable = (table: ITable) => {
    const isTheSameTable: boolean = table?.id === selectedTable?.id;
    return selectedTable && isTheSameTable ? handleSelectTable(null) : handleSelectTable(table);

  };


  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModalTranfer = () => setIsModalOpen(true);
  const handleCloseModalTranfer = () => setIsModalOpen(false);

  const handleConfirmTransfer = async (toTableId: string) => {
    if (selectedOrderByTable) {
      const data: IOrderTranfer = {
        id: selectedOrderByTable.id,
        fromTableId: table.id,
        toTableId,
      };
      const response = token && (await transferOrder(token, data));
      if (response) {
        Swal.fire("Éxito", "Mesa tranferida correctamente.", "success");
      }

    } else {
      Swal.fire("Disculpe", "No se pudo transferir la mesa. Vuelva a intentarlo", "warning");
    }
    setIsModalOpen(false);
  };



  return (
    <div
      style={{
        width: "30%",
        height: "5rem",
        backgroundColor: "#fff3de",
        boxShadow: `0px 4px 10px rgba(0, 0, 0, 0.10`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: "0.5rem",
        cursor: "pointer",
        transition: "background-color 0.3s ease",
        position: "relative",
      }}
      onClick={() => handleClickTable(table)}
    >
      {/* Indicador de estado */}
      <div
        style={{
          width: "12px",
          height: "12px",
          backgroundColor: borderColor,
          borderRadius: "50%",
          position: "absolute",
          top: "8px",
          right: "8px",
        }}
      />

      <Tooltip title={"Table: " + table.name} arrow>
        <ListItemText
          style={{
            color: "#fff",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 1,
            overflow: "hidden",
            padding: "0.5rem",
          }}
          primary={
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "black" }}>
              {table.name}
            </Typography>
          }
        />
      </Tooltip>

      {/* Botones */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "0.5rem" }}>
        <Tooltip title="Ver detalles" arrow>
          <Button
            sx={{ minWidth: "2.5rem", color: "#bab6b6" }}
            onClick={() => handleClickTable(table)} >
            {
              selectedTable?.id === table.id ? <VisibilityOffIcon /> : <VisibilityIcon />
            }
          </Button>
        </Tooltip>
        <Tooltip title="Mover mesa" arrow>
          <Button
            sx={{ minWidth: "2.5rem", color: "#bab6b6" }}
            onClick={(e) => {
              () => handleClickTable(table);
              handleOpenModalTranfer();
            }}
          >
            <PivotTableChartIcon />
          </Button>
        </Tooltip>
        {
          role !== UserRole.MOZO && (
            <>
              <Tooltip title="Editar mesa" arrow>
                <Button
                  sx={{ minWidth: "2.5rem", color: "#bab6b6" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal(TableModalType.EDIT, table);
                  }}
                >
                  <EditIcon />
                </Button>
              </Tooltip>

              <Tooltip title="Eliminar mesa" arrow>
                <Button
                  sx={{ minWidth: "2.5rem", color: "#bab6b6" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(table.id);
                  }}
                >
                  <DeleteIcon />
                </Button>
              </Tooltip>
            </>
          )
        }
      </div>
      <TransferTableModal
        open={isModalOpen}
        onClose={handleCloseModalTranfer}
        onConfirm={handleConfirmTransfer}
        excludeTableId={table.id}
      />
    </div>
  );
};

export default TableCard;
