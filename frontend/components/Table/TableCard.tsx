'use client'
import React, { useEffect, useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Button, ListItemText, Tooltip, Typography } from "@mui/material";
import { useRoomContext } from '@/app/context/room.context';
import { useAuth } from "@/app/context/authContext";
import { UserRole } from "../Enums/user";
import { TableModalType } from "../Enums/table";
import { ITable } from "../Interfaces/ITable";

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

  useEffect(() => {
    setRole(userRoleFromToken());
  }, []);

  const handleClickTable = (table: ITable) => {
    const isTheSameTable: boolean = table?.id === selectedTable?.id;
    return selectedTable && isTheSameTable ? handleSelectTable(null) : handleSelectTable(table);

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
        {
          role !== UserRole.MOZO && (
            <>
              <Tooltip title="Editar table" arrow>
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
              <Tooltip title="Eliminar table" arrow>
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
    </div>
  );
};

export default TableCard;
