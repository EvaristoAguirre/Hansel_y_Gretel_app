'use client'
import React, { useEffect, useState } from "react";
import { MesaCardProps, MesaInterface } from "../Interfaces/Cafe_interfaces";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Button, ListItemText, Tooltip, Typography } from "@mui/material";
import { useOrderContext } from '../../app/context/order.context';
import { useRoomContext } from '@/app/context/room.context';
import { useAuth } from "@/app/context/authContext";
import { UserRole } from "../Enums/user";

const TableCard: React.FC<MesaCardProps> = ({
  mesa, handleOpenModal, handleDelete
}) => {
  const mesaColors = {
    available: "#21b421",
    open: "#d94d22",
    pending_payment: "#f9b32d",
    closed: "#21b492",
  };
  const { selectedSala, handleSelectMesa, selectedMesa } = useRoomContext();
  const borderColor = (mesa && mesa.state) ? mesaColors[mesa.state] : mesaColors.closed;
  const { userRoleFromToken } = useAuth();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(userRoleFromToken());
  }, []);

  const handleClickMesa = (table: MesaInterface) => {
    const isTheSameTable: boolean = table?.id === selectedMesa?.id;
    return selectedMesa && isTheSameTable ? handleSelectMesa(null) : handleSelectMesa(table);
  };



  return (
    <div
      style={{
        width: "30%",
        height: "5rem",
        backgroundColor: "#fff3de",
        // border: `2px solid ${borderColor}`,
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
      onClick={() => handleClickMesa(mesa)}
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

      <Tooltip title={"Mesa: " + mesa.name} arrow>
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
              {mesa.name}
            </Typography>
          }
        />
      </Tooltip>

      {/* Botones */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "0.5rem" }}>
        <Tooltip title="Ver detalles" arrow>
          <Button sx={{ minWidth: "2.5rem", color: "#bab6b6" }} onClick={() => handleClickMesa(mesa)}>
            <VisibilityIcon />
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
                    handleOpenModal("edit", mesa);
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
                    handleDelete(mesa.id);
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
