'use client'
import React from "react";
import { MesaCardProps } from "../Interfaces/Cafe_interfaces";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Button, ListItemText, Tooltip, Typography } from "@mui/material";

const TableCard: React.FC<MesaCardProps> = ({
  mesa, handleOpenModal, handleDelete, setSelectedMesa
}) => {

  return (
    <div
      style={{
        width: "30%",
        height: "5rem",
        backgroundColor: "black",
        borderColor:
          mesa.state === "open" ? "#d94d22" :
            mesa.state === "available" ? "#21b421" :
              mesa.state === "pending_payment" ? "#f9b32d" : "#21b492",
        borderWidth: 2,
        borderStyle: "solid",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: "0.5rem",
        cursor: "pointer",
        transition: "background-color 0.3s ease",
      }}
      onClick={() => setSelectedMesa(mesa)}
    >
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
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#fff" }}>
              {mesa.name}
            </Typography>
          }
        />
      </Tooltip>
      <div style={{
        display: "flex", justifyContent: "center",
        marginTop: "0.5rem"
      }}>
        {/* BOTON DE VISUALIZAR */}
        <Tooltip title="Ver detalles" arrow>
          <Button
            sx={{
              minWidth: "2.5rem",
              color: "#bab6b6",
            }}
            className="hover:text-white transition-colors duration-300 ease-in-out"
          >
            <VisibilityIcon />
          </Button>
        </Tooltip>

        {/* BOTON DE EDITAR */}
        <Tooltip title="Editar mesa" arrow>
          <Button
            sx={{
              minWidth: "2.5rem",
              color: "#bab6b6",
            }}
            className="hover:text-white transition-colors duration-300 ease-in-out"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal("edit", mesa);
            }}
          >
            <EditIcon />
          </Button>
        </Tooltip>

        {/* BOTON DE ELIMINAR */}
        <Tooltip title="Eliminar mesa" arrow>
          <Button
            sx={{
              minWidth: "2.5rem",
              color: "#bab6b6",
            }}
            className="hover:text-white transition-colors duration-300 ease-in-out"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(mesa.id);
            }}
          >
            <DeleteIcon />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default TableCard;
